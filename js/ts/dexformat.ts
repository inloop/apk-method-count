///<reference path="defs/jszip.d.ts"/>
///<reference path="defs/jdataview.d.ts"/>
///<reference path="defs/filereader.d.ts"/>
///<reference path="dexdefs.ts"/>

/**
 * dexjs 0.4
 * Written by Juraj Novak (inloop.eu)
 * based on https://github.com/mihaip/dex-method-counts
 * https://source.android.com/devices/tech/dalvik/dex-format.html
 */
namespace DexFormat {

    export class DexFileReader {

        //Constants
        private static DEX_FILE_MAGIC:number[] = [0x64, 0x65, 0x78, 0x0a, 0x30, 0x33, 0x36, 0x00];
        private static DEX_FILE_MAGIC_API_13:number[] = [0x64, 0x65, 0x78, 0x0a, 0x30, 0x33, 0x35, 0x00];
        private static CLASSES_FILENAME = /classes\d*\.dex/;

        private header:DexHeader;
        private strings:string[] = [];
        private types:TypeDef[] = [];
        private protos:ProtoDef[] = [];
        private fields:FieldDef[] = [];
        private methods:MethodDef[] = [];
        private classes:ClassDef[] = [];

        private multidex:boolean = false;

        constructor(inputFileStream:ArrayBuffer) {
            var zip = new JSZip(inputFileStream);
            var files = zip.file(DexFileReader.CLASSES_FILENAME);

            //Check if contains at least one dex file
            if (files.length > 0) {
                this.multidex = files.length > 1;

                //Clear previous data
                this.strings.splice(0, this.strings.length);
                this.types.splice(0, this.types.length);
                this.protos.splice(0, this.protos.length);
                this.fields.splice(0, this.fields.length);
                this.methods.splice(0, this.methods.length);
                this.classes.splice(0, this.classes.length);

                for (var i = 0; i < files.length; i++) {
                    var dv = new jDataView(files[i].asArrayBuffer());
                    if (DexFileReader.isValidDexFile(dv.getBytes(8))) {
                        this.header = new DexHeader(dv);
                        this.loadStrings(dv);
                        this.loadTypes(dv);
                        this.loadProtos(dv);
                        this.loadFields(dv);
                        this.loadMethods(dv);
                        this.loadClasses(dv);

                        this.markInternalClasses();
                    } else {
                        throw new Error("APK not compatible.");
                    }
                }
            } else {
                throw new Error("APK does not contain .dex file(s).");
            }
        }

        public isMultidex():boolean {
            return this.multidex;
        }

        public static getClassNameOnly(typeName:string):string {
            var dotted = DexFileReader.descriptorToDot(typeName);
            var start = dotted.lastIndexOf(".");
            if (start < 0) {
                return dotted;
            } else {
                return dotted.substring(start+1);
            }
        }

        public static getPackageNameOnly(typeName:string):string {
            var dotted = DexFileReader.descriptorToDot(typeName);
            var end = dotted.lastIndexOf(".");
            if (end < 0) {
                return "";
            } else {
                return dotted.substring(0, end);
            }
        }

        public static descriptorToDot(descr:string):string {
            var targetLen = descr.length;
            var offset = 0;
            var arrayDepth = 0;

            /* strip leading [s; will be added to end */
            while (targetLen > 1 && descr.charAt(offset) == '[') {
                offset++;
                targetLen--;
            }
            arrayDepth = offset;

            if (targetLen == 1) {
                descr = DexFileReader.getPrimitiveType(descr.charAt(offset));
                offset = 0;
                targetLen = descr.length;
            } else {
                /* account for leading 'L' and trailing ';' */
                if (targetLen >= 2 && descr.charAt(offset) == 'L' &&
                    descr.charAt(offset+targetLen-1) == ';')
                {
                    targetLen -= 2;     /* two fewer chars to copy */
                    offset++;           /* skip the 'L' */
                }
            }

            var buf = [];

            /* copy class name over */
            var i;
            for (i = 0; i < targetLen; i++) {
                var ch = descr.charAt(offset + i);
                buf[i] = (ch == '/') ? '.' : ch;
            }

            /* add the appopriate number of brackets for arrays */
            while (arrayDepth-- > 0) {
                buf[i++] = '[';
                buf[i++] = ']';
            }

            return buf.join("");
        }

        private static isValidDexFile(bytes:number[]):boolean {
            for (var i = 0; i < bytes.length; i++) {
                if (!(bytes[i] === DexFileReader.DEX_FILE_MAGIC[i] || bytes[i] === DexFileReader.DEX_FILE_MAGIC_API_13[i])) {
                    return false;
                }
            }
            return true;
        }

        private markInternalClasses():void {
            for (var i = this.classes.length - 1; i >= 0; i--) {
                this.classes[i].getClassType().setInternal(true);
            }

            for (var i = 0; i < this.types.length; i++) {
                var className = this.types[i].getDescriptor();

                if (className.length == 1) {
                    // primitive class
                    this.types[i].setInternal(true);
                } else if (className.charAt(0) == '[') {
                    this.types[i].setInternal(true);
                }
            }
        }

        private loadStrings(dv:jDataView):void {
            var curStrings:string[] = [];
            var offsets:number[] = [];
            dv.seek(this.header.stringIdsOff);

            for (var i = 0; i < this.header.stringIdsSize; i++) {
                offsets[i] = dv.getInt32();
            }

            dv.seek(offsets[0]);
            for (var i = 0; i < this.header.stringIdsSize; i++) {
                dv.seek(offsets[i]);
                curStrings[i] = dv.readStringUtf();
            }
            this.strings = this.strings.concat(curStrings);
        }

        private loadTypes(dv:jDataView):void {
            var curTypes:TypeDef[] = [];
            dv.seek(this.header.typeIdsOff);
            for (var i = 0; i < this.header.typeIdsSize; i++) {
                var descriptorIdx = dv.getInt32();
                curTypes[i] = new TypeDef(this, descriptorIdx);
            }
            this.types = this.types.concat(curTypes);
        }

        private loadProtos(dv:jDataView):void {
            var curProtos:ProtoDef[] = [];
            dv.seek(this.header.protoIdsOff);
            for (var i = 0; i < this.header.protoIdsSize; i++) {
                var shortyIdx = dv.getInt32();
                var returnTypeIdx = dv.getInt32();
                var parametersOff = dv.getInt32();
                curProtos[i] = new ProtoDef(this, shortyIdx, returnTypeIdx, parametersOff);
            }

            /*for (var i = 0; i < this.header.protoIdsSize; i++) {
                var offset = curProtos[i].parametersOff;
                curProtos[i].types = [];
                if (offset != 0) {
                    dv.seek(offset);
                    var size = dv.getInt32();

                    for (var j = 0; j < size; j++) {
                        curProtos[i].types[j] = dv.getInt16() & 0xffff;
                    }
                }
            }*/
            this.protos = this.protos.concat(curProtos)
        }

        private loadFields(dv:jDataView):void {
            var curFields:FieldDef[] = [];
            dv.seek(this.header.fieldIdsOff);
            for (var i = 0; i < this.header.fieldIdsSize; i++) {
                var classIdx = dv.getInt16() & 0xffff;
                var typeIdx = dv.getInt16() & 0xffff;
                var nameIdx = dv.getInt32();
                curFields[i] = new FieldDef(this, classIdx, typeIdx, nameIdx);
            }
            this.fields = this.fields.concat(curFields);
        }

        private loadMethods(dv:jDataView):void {
            var curMethods:MethodDef[] = [];
            dv.seek(this.header.methodIdsOff);
            for (var i = 0; i < this.header.methodIdsSize; i++) {
                var classIdx = dv.getInt16() & 0xffff;
                var protoIdx = dv.getInt16() & 0xffff;
                var nameIdx = dv.getInt32();
                curMethods[i] = new MethodDef(this, classIdx, protoIdx, nameIdx);
            }
            this.methods = this.methods.concat(curMethods);
        }

        private loadClasses(dv:jDataView):void {
            var curClasses:ClassDef[] = [];
            dv.seek(this.header.classDefsOff);
            for (var i = 0; i < this.header.classDefsSize; i++) {
                var classIdx = dv.getInt32();
                var accessFlags = dv.getInt32();
                var superclassIdx = dv.getInt32();
                var interfacesOff = dv.getInt32();
                var sourceFileIdx = dv.getInt32();
                var annotationsOff = dv.getInt32();
                var classDataOff = dv.getInt32();
                var staticValuesOff = dv.getInt32();
                curClasses[i] = new ClassDef(this, classIdx, accessFlags, superclassIdx, interfacesOff,
                    sourceFileIdx, annotationsOff, classDataOff, staticValuesOff);

            }
            this.classes = this.classes.concat(curClasses);
        }

        private static getPrimitiveType(typeChar:string):string {
            switch (typeChar) {
                case 'B':   return "byte";
                case 'C':   return "char";
                case 'D':   return "double";
                case 'F':   return "float";
                case 'I':   return "int";
                case 'J':   return "long";
                case 'S':   return "short";
                case 'V':   return "void";
                case 'Z':   return "boolean";
                default:
                    throw "Unexpected class char " + typeChar;
                    return "UNKNOWN";
            }
        }

        public getMethodRefs():MethodDef[] {
            return this.methods;
        }

        public getString(idx:number):string {
            return this.strings[idx];
        }

        public getType(idx:number):TypeDef {
            return this.types[idx];
        }

        public getProto(idx:number):ProtoDef {
            return this.protos[idx];
        }

        public getClass(idx:number):ClassDef {
            for (var i = 0; i < this.classes.length; i++) {
                var searchIdx = this.classes[i].getClassIdx();
                if (idx == searchIdx) {
                    return this.classes[i];
                }
            }
            return null;
        }

    }

    class DexHeader {
        private static ENDIAN_CONSTANT:number = 0x12345678;
        private static REVERSE_ENDIAN_CONSTANT:number = 0x78563412;

        public fileSize:number;
        public headerSize:number;
        public endianTag:number;
        public linkSize:number;
        public linkOff:number;
        public mapOff:number;
        public stringIdsSize:number;
        public stringIdsOff:number;
        public typeIdsSize:number;
        public typeIdsOff:number;
        public protoIdsSize:number;
        public protoIdsOff:number;
        public fieldIdsSize:number;
        public fieldIdsOff:number;
        public methodIdsSize:number;
        public methodIdsOff:number;
        public classDefsSize:number;
        public classDefsOff:number;
        public dataSize:number;
        public dataOff:number;

        constructor(dv:jDataView) {
            //Read endian tag first
            dv.seek(8 + 4 + 20 + 4 + 4);
            this.endianTag = dv.getInt32();
            if (this.endianTag === DexHeader.ENDIAN_CONSTANT) {
                dv._littleEndian = false;
            } else if (this.endianTag === DexHeader.REVERSE_ENDIAN_CONSTANT) {
                dv._littleEndian = true;
            } else {
                throw new Error("APK read error (endianTag)!");
            }

            dv.seek(8 + 4 + 20);
            this.fileSize = dv.getInt32();
            this.headerSize = dv.getInt32();
            this.endianTag = dv.getInt32();
            this.linkSize = dv.getInt32();
            this.linkOff = dv.getInt32();
            this.mapOff = dv.getInt32();
            this.stringIdsSize = dv.getInt32();
            this.stringIdsOff = dv.getInt32();
            this.typeIdsSize = dv.getInt32();
            this.typeIdsOff = dv.getInt32();
            this.protoIdsSize = dv.getInt32();
            this.protoIdsOff = dv.getInt32();
            this.fieldIdsSize = dv.getInt32();
            this.fieldIdsOff = dv.getInt32();
            this.methodIdsSize = dv.getInt32();
            this.methodIdsOff = dv.getInt32();
            this.classDefsSize = dv.getInt32();
            this.classDefsOff = dv.getInt32();
            this.dataSize = dv.getInt32();
            this.dataOff = dv.getInt32();
        }
    }

    jDataView.prototype.readStringUtf = function () {
        var len = this.readUnsignedLeb128();
        return this.getString(len);
    };

    jDataView.prototype.readUnsignedLeb128 = function () {
        var result = 0;
        do {
            var b = this.getUint8();
            result = (result << 7) | (b & 0x7f);
        } while (b < 0);

        return result;
    };
}