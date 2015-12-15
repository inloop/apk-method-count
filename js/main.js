///<reference path="dexformat.ts"/>
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var DexFormat;
(function (DexFormat) {
    (function (AccessFlags) {
        AccessFlags[AccessFlags["ACC_PUBLIC"] = 1] = "ACC_PUBLIC";
        AccessFlags[AccessFlags["ACC_PRIVATE"] = 2] = "ACC_PRIVATE";
        AccessFlags[AccessFlags["ACC_PROTECTED"] = 4] = "ACC_PROTECTED";
        AccessFlags[AccessFlags["ACC_STATIC"] = 8] = "ACC_STATIC";
        AccessFlags[AccessFlags["ACC_FINAL"] = 16] = "ACC_FINAL";
        AccessFlags[AccessFlags["ACC_SYNCHRONIZED"] = 32] = "ACC_SYNCHRONIZED";
        AccessFlags[AccessFlags["ACC_VOLATILE"] = 64] = "ACC_VOLATILE";
        AccessFlags[AccessFlags["ACC_BRIDGE"] = 64] = "ACC_BRIDGE";
        AccessFlags[AccessFlags["ACC_TRANSIENT"] = 128] = "ACC_TRANSIENT";
        AccessFlags[AccessFlags["ACC_VARARGS"] = 128] = "ACC_VARARGS";
        AccessFlags[AccessFlags["ACC_NATIVE"] = 256] = "ACC_NATIVE";
        AccessFlags[AccessFlags["ACC_INTERFACE"] = 512] = "ACC_INTERFACE";
        AccessFlags[AccessFlags["ACC_ABSTRACT"] = 1024] = "ACC_ABSTRACT";
        AccessFlags[AccessFlags["ACC_STRICT"] = 2048] = "ACC_STRICT";
        AccessFlags[AccessFlags["ACC_SYNTHETIC"] = 4096] = "ACC_SYNTHETIC";
        AccessFlags[AccessFlags["ACC_ANNOTATION"] = 8192] = "ACC_ANNOTATION";
        AccessFlags[AccessFlags["ACC_ENUM"] = 16384] = "ACC_ENUM";
        AccessFlags[AccessFlags["ACC_CONSTRUCTOR"] = 65536] = "ACC_CONSTRUCTOR";
        AccessFlags[AccessFlags["ACC_DECLARED_SYNCHRONIZED"] = 131072] = "ACC_DECLARED_SYNCHRONIZED";
    })(DexFormat.AccessFlags || (DexFormat.AccessFlags = {}));
    var AccessFlags = DexFormat.AccessFlags;
    var BaseDef = (function () {
        function BaseDef(reader) {
            this.reader = reader;
        }
        BaseDef.NO_INDEX = 0xffffffff;
        return BaseDef;
    })();
    var ClassBaseDef = (function (_super) {
        __extends(ClassBaseDef, _super);
        function ClassBaseDef() {
            _super.apply(this, arguments);
        }
        ClassBaseDef.prototype.getClassData = function () {
            return this.reader.getClass(this.classIdx);
        };
        ClassBaseDef.prototype.getClassType = function () {
            return this.reader.getType(this.classIdx);
        };
        ClassBaseDef.prototype.getClassIdx = function () {
            return this.classIdx;
        };
        return ClassBaseDef;
    })(BaseDef);
    var TypeDef = (function (_super) {
        __extends(TypeDef, _super);
        function TypeDef(reader, descriptorIdx) {
            _super.call(this, reader);
            this.descriptorIdx = descriptorIdx;
        }
        TypeDef.prototype.getDescriptor = function () {
            return this.reader.getString(this.descriptorIdx);
        };
        TypeDef.prototype.setInternal = function (internal) {
            this.internal = internal;
        };
        TypeDef.prototype.isInternal = function () {
            return this.internal;
        };
        return TypeDef;
    })(BaseDef);
    DexFormat.TypeDef = TypeDef;
    var ProtoDef = (function (_super) {
        __extends(ProtoDef, _super);
        function ProtoDef(reader, shortyIdx, returnTypeIdx, parametersOff) {
            _super.call(this, reader);
            this.shortyIdx = shortyIdx;
            this.returnTypeIdx = returnTypeIdx;
            this.parametersOff = parametersOff;
        }
        ProtoDef.prototype.getShorty = function () {
            return this.reader.getString(this.shortyIdx);
        };
        ProtoDef.prototype.getParametersOff = function () {
            return this.parametersOff;
        };
        ProtoDef.prototype.getReturnType = function () {
            return this.reader.getType(this.returnTypeIdx);
        };
        return ProtoDef;
    })(BaseDef);
    DexFormat.ProtoDef = ProtoDef;
    var FieldDef = (function (_super) {
        __extends(FieldDef, _super);
        function FieldDef(reader, classIdx, typeIdx, nameIdx) {
            _super.call(this, reader);
            this.classIdx = classIdx;
            this.typeIdx = typeIdx;
            this.nameIdx = nameIdx;
        }
        FieldDef.prototype.getName = function () {
            return this.reader.getString(this.nameIdx);
        };
        FieldDef.prototype.getType = function () {
            return this.reader.getType(this.typeIdx);
        };
        return FieldDef;
    })(ClassBaseDef);
    DexFormat.FieldDef = FieldDef;
    var MethodDef = (function (_super) {
        __extends(MethodDef, _super);
        function MethodDef(reader, classIdx, protoIdx, nameIdx) {
            _super.call(this, reader);
            this.classIdx = classIdx;
            this.protoIdx = protoIdx;
            this.nameIdx = nameIdx;
        }
        MethodDef.prototype.getName = function () {
            return this.reader.getString(this.nameIdx);
        };
        MethodDef.prototype.getProto = function () {
            return this.reader.getProto(this.protoIdx);
        };
        return MethodDef;
    })(ClassBaseDef);
    DexFormat.MethodDef = MethodDef;
    var ClassDef = (function (_super) {
        __extends(ClassDef, _super);
        function ClassDef(reader, classIdx, accessFlags, superclassIdx, interfacesOff, sourceFileIdx, annotationsOff, classDataOff, staticValuesOff) {
            _super.call(this, reader);
            this.classIdx = classIdx;
            this.accessFlags = accessFlags;
            this.superclassIdx = superclassIdx;
            this.interfacesOff = interfacesOff;
            this.sourceFileIdx = sourceFileIdx;
            this.annotationsOff = annotationsOff;
            this.classDataOff = classDataOff;
            this.staticValuesOff = staticValuesOff;
        }
        ClassDef.prototype.getClassIdx = function () {
            return this.classIdx;
        };
        ClassDef.prototype.isAccessFlag = function (flag) {
            return (this.accessFlags & flag) == flag;
        };
        ClassDef.prototype.getSourceFileName = function () {
            return this.reader.getString(this.sourceFileIdx);
        };
        ClassDef.prototype.getClassType = function () {
            return this.reader.getType(this.classIdx);
        };
        ClassDef.prototype.getSuperclassType = function () {
            if (this.superclassIdx == BaseDef.NO_INDEX) {
                return null;
            }
            else {
                return this.reader.getType(this.superclassIdx);
            }
        };
        ClassDef.prototype.getInterfacesOff = function () {
            return this.interfacesOff;
        };
        ClassDef.prototype.getAnnotationsOff = function () {
            return this.annotationsOff;
        };
        ClassDef.prototype.getClassDataOff = function () {
            return this.classDataOff;
        };
        ClassDef.prototype.getStaticValuesOff = function () {
            return this.staticValuesOff;
        };
        return ClassDef;
    })(BaseDef);
    DexFormat.ClassDef = ClassDef;
})(DexFormat || (DexFormat = {}));
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
var DexFormat;
(function (DexFormat) {
    var DexFileReader = (function () {
        function DexFileReader(inputFileStream) {
            this.strings = [];
            this.types = [];
            this.protos = [];
            this.fields = [];
            this.methods = [];
            this.classes = [];
            this.multidex = false;
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
                    }
                    else {
                        throw new Error("APK not compatible.");
                    }
                }
            }
            else {
                throw new Error("APK does not contain .dex file(s).");
            }
        }
        DexFileReader.prototype.isMultidex = function () {
            return this.multidex;
        };
        DexFileReader.getClassNameOnly = function (typeName) {
            var dotted = DexFileReader.descriptorToDot(typeName);
            var start = dotted.lastIndexOf(".");
            if (start < 0) {
                return dotted;
            }
            else {
                return dotted.substring(start + 1);
            }
        };
        DexFileReader.getPackageNameOnly = function (typeName) {
            var dotted = DexFileReader.descriptorToDot(typeName);
            var end = dotted.lastIndexOf(".");
            if (end < 0) {
                return "";
            }
            else {
                return dotted.substring(0, end);
            }
        };
        DexFileReader.descriptorToDot = function (descr) {
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
            }
            else {
                /* account for leading 'L' and trailing ';' */
                if (targetLen >= 2 && descr.charAt(offset) == 'L' &&
                    descr.charAt(offset + targetLen - 1) == ';') {
                    targetLen -= 2; /* two fewer chars to copy */
                    offset++; /* skip the 'L' */
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
        };
        DexFileReader.isValidDexFile = function (bytes) {
            for (var i = 0; i < bytes.length; i++) {
                if (!(bytes[i] === DexFileReader.DEX_FILE_MAGIC[i] || bytes[i] === DexFileReader.DEX_FILE_MAGIC_API_13[i])) {
                    return false;
                }
            }
            return true;
        };
        DexFileReader.prototype.markInternalClasses = function () {
            for (var i = this.classes.length - 1; i >= 0; i--) {
                this.classes[i].getClassType().setInternal(true);
            }
            for (var i = 0; i < this.types.length; i++) {
                var className = this.types[i].getDescriptor();
                if (className.length == 1) {
                    // primitive class
                    this.types[i].setInternal(true);
                }
                else if (className.charAt(0) == '[') {
                    this.types[i].setInternal(true);
                }
            }
        };
        DexFileReader.prototype.loadStrings = function (dv) {
            var curStrings = [];
            var offsets = [];
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
        };
        DexFileReader.prototype.loadTypes = function (dv) {
            var curTypes = [];
            dv.seek(this.header.typeIdsOff);
            for (var i = 0; i < this.header.typeIdsSize; i++) {
                var descriptorIdx = dv.getInt32();
                curTypes[i] = new DexFormat.TypeDef(this, descriptorIdx);
            }
            this.types = this.types.concat(curTypes);
        };
        DexFileReader.prototype.loadProtos = function (dv) {
            var curProtos = [];
            dv.seek(this.header.protoIdsOff);
            for (var i = 0; i < this.header.protoIdsSize; i++) {
                var shortyIdx = dv.getInt32();
                var returnTypeIdx = dv.getInt32();
                var parametersOff = dv.getInt32();
                curProtos[i] = new DexFormat.ProtoDef(this, shortyIdx, returnTypeIdx, parametersOff);
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
            this.protos = this.protos.concat(curProtos);
        };
        DexFileReader.prototype.loadFields = function (dv) {
            var curFields = [];
            dv.seek(this.header.fieldIdsOff);
            for (var i = 0; i < this.header.fieldIdsSize; i++) {
                var classIdx = dv.getInt16() & 0xffff;
                var typeIdx = dv.getInt16() & 0xffff;
                var nameIdx = dv.getInt32();
                curFields[i] = new DexFormat.FieldDef(this, classIdx, typeIdx, nameIdx);
            }
            this.fields = this.fields.concat(curFields);
        };
        DexFileReader.prototype.loadMethods = function (dv) {
            var curMethods = [];
            dv.seek(this.header.methodIdsOff);
            for (var i = 0; i < this.header.methodIdsSize; i++) {
                var classIdx = dv.getInt16() & 0xffff;
                var protoIdx = dv.getInt16() & 0xffff;
                var nameIdx = dv.getInt32();
                curMethods[i] = new DexFormat.MethodDef(this, classIdx, protoIdx, nameIdx);
            }
            this.methods = this.methods.concat(curMethods);
        };
        DexFileReader.prototype.loadClasses = function (dv) {
            var curClasses = [];
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
                curClasses[i] = new DexFormat.ClassDef(this, classIdx, accessFlags, superclassIdx, interfacesOff, sourceFileIdx, annotationsOff, classDataOff, staticValuesOff);
            }
            this.classes = this.classes.concat(curClasses);
        };
        DexFileReader.getPrimitiveType = function (typeChar) {
            switch (typeChar) {
                case 'B': return "byte";
                case 'C': return "char";
                case 'D': return "double";
                case 'F': return "float";
                case 'I': return "int";
                case 'J': return "long";
                case 'S': return "short";
                case 'V': return "void";
                case 'Z': return "boolean";
                default:
                    throw "Unexpected class char " + typeChar;
                    return "UNKNOWN";
            }
        };
        DexFileReader.prototype.getMethodRefs = function () {
            return this.methods;
        };
        DexFileReader.prototype.getString = function (idx) {
            return this.strings[idx];
        };
        DexFileReader.prototype.getType = function (idx) {
            return this.types[idx];
        };
        DexFileReader.prototype.getProto = function (idx) {
            return this.protos[idx];
        };
        DexFileReader.prototype.getClass = function (idx) {
            for (var i = 0; i < this.classes.length; i++) {
                var searchIdx = this.classes[i].getClassIdx();
                if (idx == searchIdx) {
                    return this.classes[i];
                }
            }
            return null;
        };
        //Constants
        DexFileReader.DEX_FILE_MAGIC = [0x64, 0x65, 0x78, 0x0a, 0x30, 0x33, 0x36, 0x00];
        DexFileReader.DEX_FILE_MAGIC_API_13 = [0x64, 0x65, 0x78, 0x0a, 0x30, 0x33, 0x35, 0x00];
        DexFileReader.CLASSES_FILENAME = /classes\d*\.dex/;
        return DexFileReader;
    })();
    DexFormat.DexFileReader = DexFileReader;
    var DexHeader = (function () {
        function DexHeader(dv) {
            //Read endian tag first
            dv.seek(8 + 4 + 20 + 4 + 4);
            this.endianTag = dv.getInt32();
            if (this.endianTag === DexHeader.ENDIAN_CONSTANT) {
                dv._littleEndian = false;
            }
            else if (this.endianTag === DexHeader.REVERSE_ENDIAN_CONSTANT) {
                dv._littleEndian = true;
            }
            else {
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
        DexHeader.ENDIAN_CONSTANT = 0x12345678;
        DexHeader.REVERSE_ENDIAN_CONSTANT = 0x78563412;
        return DexHeader;
    })();
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
})(DexFormat || (DexFormat = {}));
///<reference path="main.ts"/>
var ApkMethodCount;
(function (ApkMethodCount) {
    var Model = (function () {
        function Model() {
        }
        Model.prototype.getCurrentTreemap = function () {
            return this.currentTreemap;
        };
        Model.prototype.loadDexFile = function (arrayBuffer) {
            var dexFile = new DexFileReader(arrayBuffer);
            var methodRefs = dexFile.getMethodRefs();
            var treemap = [];
            for (var i = 0; i < methodRefs.length; i++) {
                var classData = methodRefs[i].getClassData();
                var classType = methodRefs[i].getClassType();
                var classDescriptor = classType.getDescriptor();
                var packageName = DexFileReader.getPackageNameOnly(classDescriptor);
                var packageNameParts = packageName.split(".");
                //Empty package
                if (packageNameParts.length == 1 && packageNameParts[0].length == 0) {
                    packageNameParts[0] = Model.EMPTY_PACKAGE_NAME;
                }
                //Build tree map of classes
                var currentNode = treemap[packageNameParts[0]];
                if (typeof currentNode === "undefined") {
                    currentNode = treemap[packageNameParts[0]] = {};
                }
                var classIdx = methodRefs[i].getClassIdx();
                for (var j = 0; j < packageNameParts.length; j++) {
                    if (j >= 1) {
                        if (typeof currentNode[packageNameParts[j]] === "undefined") {
                            currentNode[packageNameParts[j]] = [];
                        }
                        currentNode = currentNode[packageNameParts[j]];
                    }
                    var metaNode;
                    if (typeof currentNode[ApkMethodCount.AppView.TREE_META_NODE] === "undefined") {
                        metaNode = currentNode[ApkMethodCount.AppView.TREE_META_NODE] = new PackageNodeMetaData();
                    }
                    else {
                        metaNode = currentNode[ApkMethodCount.AppView.TREE_META_NODE];
                    }
                    metaNode.incrementMethodCount();
                    //Save classes and their method counts
                    if (j >= Model.TREE_CLASS_LEVEL) {
                        metaNode.addClassAndIncrement(classIdx, new ClassDataWrapper(classType, classData));
                    }
                }
            }
            //Save reference for later (showing package details)
            this.currentTreemap = treemap;
            return { tree: treemap, methodsCount: methodRefs.length, multidex: dexFile.isMultidex() };
        };
        Model.prototype.isInnerClassFromName = function (className) {
            return className.match(Model.INNER_CLASS_REGEX) !== null;
        };
        Model.prototype.formatType = function (className, classData) {
            var classDef = classData.getClassDef();
            if (classDef != null) {
                if (classDef.isAccessFlag(DexFormat.AccessFlags.ACC_INTERFACE)) {
                    return Model.ICON_INTERFACE;
                }
                else if (classDef.isAccessFlag(DexFormat.AccessFlags.ACC_ENUM)) {
                    return Model.ICON_ENUM;
                }
                else {
                    return Model.ICON_CLASS;
                }
            }
            else if (className.lastIndexOf("[]") == className.length - 2) {
                return Model.ICON_ENUM;
            }
            else {
                return Model.ICON_REF;
            }
        };
        Model.prototype.extractFileNameWithoutExt = function (filename) {
            var dotIndex = filename.lastIndexOf(".");
            if (dotIndex > -1) {
                return filename.substr(0, dotIndex);
            }
            else {
                return filename;
            }
        };
        Model.EMPTY_PACKAGE_NAME = "(empty)";
        Model.ICON_INTERFACE = "interface";
        Model.ICON_CLASS = "class";
        Model.ICON_ENUM = "enum";
        Model.ICON_REF = "reference";
        Model.INNER_CLASS_REGEX = /^\d+$/;
        Model.START_LEVEL_VISIBLE = 1;
        Model.TREE_CLASS_LEVEL = 1;
        return Model;
    })();
    ApkMethodCount.Model = Model;
    var ClassDataWrapper = (function () {
        function ClassDataWrapper(classType, classDef) {
            this.methodCount = 0;
            this.classType = classType;
            this.classDef = classDef;
        }
        ClassDataWrapper.prototype.incrementMethodCount = function () {
            this.methodCount++;
        };
        ClassDataWrapper.prototype.getMethodCount = function () {
            return this.methodCount;
        };
        ClassDataWrapper.prototype.getClassType = function () {
            return this.classType;
        };
        ClassDataWrapper.prototype.getClassDef = function () {
            return this.classDef;
        };
        return ClassDataWrapper;
    })();
    ApkMethodCount.ClassDataWrapper = ClassDataWrapper;
    var PackageNodeMetaData = (function () {
        function PackageNodeMetaData() {
            this.classes = [];
            this.count = 0;
        }
        PackageNodeMetaData.prototype.incrementMethodCount = function () {
            this.count++;
        };
        PackageNodeMetaData.prototype.addClassAndIncrement = function (idx, classWrapper) {
            if (typeof this.classes[idx] === "undefined") {
                this.classes[idx] = classWrapper;
            }
            this.classes[idx].incrementMethodCount();
        };
        PackageNodeMetaData.prototype.getCount = function () {
            return this.count;
        };
        PackageNodeMetaData.prototype.getClassWrapper = function (idx) {
            return this.classes[idx];
        };
        PackageNodeMetaData.prototype.getSortedClasses = function () {
            var _this = this;
            return Object.keys(this.classes).sort(function (a, b) {
                return _this.classes[b].getMethodCount() - _this.classes[a].getMethodCount();
            });
        };
        return PackageNodeMetaData;
    })();
    ApkMethodCount.PackageNodeMetaData = PackageNodeMetaData;
})(ApkMethodCount || (ApkMethodCount = {}));
///<reference path="dexformat.ts"/>
///<reference path="defs/jquery.d.ts"/>
///<reference path="defs/bootstrap.d.ts"/>
///<reference path="defs/various.d.ts"/>
///<reference path="model.ts"/>
var ClassDef = DexFormat.ClassDef;
var TypeDef = DexFormat.TypeDef;
var DexFileReader = DexFormat.DexFileReader;
var ApkMethodCount;
(function (ApkMethodCount) {
    var AppView = (function () {
        function AppView() {
            var _this = this;
            this.generatedTreePlain = [];
            this.lastFilename = "classes_stats";
            this.treeView = $("#package-tree");
            this.lastMouseOverNode = null;
            this.nodeTraverse = [];
            this.model = new ApkMethodCount.Model();
            this.fileReaderOpts = {
                readAsDefault: "ArrayBuffer", on: {
                    load: function (e, v) { return _this.onLoadFile(e, v); }
                }
            };
            //Check If browser supports FileReader API
            if (typeof FileReader === "undefined") {
                $('#dropzone, #dropzone-dialog').hide();
                $('#compat-error').show();
            }
            else {
                $('#dropzone, #dropzone-dialog').fileReaderJS(this.fileReaderOpts);
            }
            //Bind event listeners
            this.treeView.on("mouseleave", function () { return _this.resetLastMouseOverNode(); });
            $("#expand-collapse-btn").on("click", function () { return _this.expandCollapseAll(); });
            $("#download-btn").on("click", function () { return _this.download(); });
            $("#dropzone").on("click", function () { return _this.dropzoneClick(); });
        }
        AppView.prototype.onLoadFile = function (e, file) {
            var _this = this;
            this.lastFilename = this.model.extractFileNameWithoutExt(file.name);
            this.setIsLoading(true);
            setTimeout(function () {
                var errorText = $(".alert-danger.box");
                try {
                    var data = _this.model.loadDexFile(e.target.result);
                    _this.renderPackages(data);
                    $("#output-box").fadeIn();
                    $(".nouploadinfo").hide();
                    $("#dropzone").delay(50).animate({ height: 50 }, 500);
                    $("#success-box").show();
                    errorText.hide();
                }
                catch (exception) {
                    console.log(exception);
                    _this.setIsLoading(false);
                    errorText.text("Not a valid APK!");
                    errorText.show();
                    $("#output-box").hide();
                    $("#success-box").hide();
                }
            }, 50);
        };
        AppView.prototype.setIsLoading = function (isLoading) {
            var dropText = $("#drop-text");
            var loading = $("#drop-loading");
            if (isLoading) {
                dropText.hide();
                loading.show();
            }
            else {
                dropText.show();
                loading.hide();
            }
        };
        AppView.prototype.renderPackages = function (data) {
            var _this = this;
            var treeBuilder = [];
            this.generatedTreePlain = [];
            this.generatedTreePlain.push("Total methods count: " + data.methodsCount);
            this.generatedTreePlain.push("");
            treeBuilder.push("<ul>");
            this.recursiveRenderPackage(treeBuilder, data.tree, 0);
            treeBuilder.push("</ul>");
            this.treeView.empty();
            this.treeView.append(treeBuilder.join(""));
            this.updateTree();
            $("#method-count-multidex").text(data.multidex ? "(multidex enabled)" : "");
            $("#method-count-total").text(data.methodsCount);
            $(".show-class-detail").on("click", function (e) {
                _this.showPackageDetail($(e.currentTarget).data("package"));
            });
            this.setIsLoading(false);
        };
        AppView.prototype.recursiveRenderPackage = function (treeBuilder, node, level) {
            //Sort current node by method counts
            var sortedNode = Object.keys(node).sort(function (a, b) {
                if (a == AppView.TREE_META_NODE || b == AppView.TREE_META_NODE)
                    return -1;
                return node[b][AppView.TREE_META_NODE].getCount() - node[a][AppView.TREE_META_NODE].getCount();
            });
            for (var item in sortedNode) {
                item = sortedNode[item];
                if (item != AppView.TREE_META_NODE) {
                    var displayStyle = level <= ApkMethodCount.Model.START_LEVEL_VISIBLE ? "visible" : "none";
                    var nodeSign = "<i class='glyphicon " + (level == 0 ? AppView.MINUS_SIGN_GLYPHICON : AppView.PLUS_SIGN_GLYPHICON) + "'></i> ";
                    var hasChildren = Object.keys(node[item]).length > 1; //TREE_META_NODE ignore
                    var count = node[item][AppView.TREE_META_NODE].getCount();
                    var extraSpan = "";
                    var extraInfo = "";
                    if (level > 0) {
                        extraSpan = this.nodeTraverse.join(".") + "." + item;
                        extraInfo = "<p class='node-info extra-info'>" +
                            "<a title='Search using Google' href='https://www.google.com/search?q=\"" + extraSpan + "\"' target='_blank'>" +
                            "<i class='glyphicon glyphicon-search' aria-hidden='true'></i></a>" +
                            "<a title='Show classes' href='javascript:void(0)' class='show-class-detail' data-package='" + extraSpan + "'>" +
                            "<i class='glyphicon glyphicon glyphicon-signal' aria-hidden='true'></i></a></p>";
                    }
                    this.generatedTreePlain.push("\t".repeat(level) + item + " [" + count + "]");
                    treeBuilder.push("<li style='display: " + displayStyle + "'><span> " + (hasChildren ? nodeSign : "") + item +
                        " <span class='badge'>" + count + "</span></span> <p class='node-info'>" + extraSpan + "</p>" + extraInfo);
                    if (hasChildren) {
                        this.nodeTraverse.push(item);
                        treeBuilder.push("<ul>");
                        level++;
                        this.recursiveRenderPackage(treeBuilder, node[item], level);
                        level--;
                        treeBuilder.push("</ul>");
                        this.nodeTraverse.pop();
                    }
                    treeBuilder.push("</li>");
                }
            }
        };
        AppView.prototype.showPackageDetail = function (packagePath) {
            var packageNameParts = packagePath.split(".");
            var currentNode = null;
            //Get classes for package
            var currentTreeMap = this.model.getCurrentTreemap();
            for (var i = 0; i < packageNameParts.length; i++) {
                if (currentNode == null) {
                    currentNode = currentTreeMap[packageNameParts[i]];
                }
                else {
                    currentNode = currentNode[packageNameParts[i]];
                }
            }
            var tableBody = $(".modal-body table tbody");
            tableBody.empty();
            //Sort by counts
            var classes = [];
            var sortedNode = currentNode[AppView.TREE_META_NODE].getSortedClasses();
            for (var item in sortedNode) {
                var data = currentNode[AppView.TREE_META_NODE].getClassWrapper(Number(sortedNode[item]));
                var count = data.getMethodCount();
                var classNameFull = data.getClassType().getDescriptor();
                var className = DexFileReader.getClassNameOnly(classNameFull);
                var classNameFullReadable = DexFileReader.descriptorToDot(classNameFull);
                var typename = this.model.formatType(className, data);
                var typeIcon = "<img src='img/types/" + typename + ".png' title='" + typename + "'/>&nbsp;";
                classes.push("<tr><td>" + typeIcon + "<span title='" + classNameFullReadable + "'>"
                    + this.formatInnerClasses(className) + "</span></td><td>" + count + "</td></tr>");
            }
            $(".modal-body").animate({ scrollTop: 0 }, "fast");
            tableBody.html(classes.join(""));
            $("#package-detail .modal-title").html("Classes of <i>" + packagePath + "</i>");
            $("#package-detail").modal();
        };
        AppView.prototype.formatInnerClasses = function (name) {
            var split = name.split("$");
            var formatted = "";
            for (var i = 0; i < split.length; i++) {
                if (i == split.length - 1) {
                    if (this.model.isInnerClassFromName(split[i])) {
                        formatted += "<span class='class-last-part'><i>(anon-cls-" + split[i] + ")</i></span>";
                    }
                    else {
                        formatted += "<span class='class-last-part'>" + split[i] + "</span>";
                    }
                }
                else {
                    formatted += "<span class='class-part'>" + split[i] + "$</span>";
                }
            }
            return formatted;
        };
        AppView.prototype.resetLastMouseOverNode = function () {
            if (this.lastMouseOverNode != null) {
                this.lastMouseOverNode.css("display", "none");
                this.lastMouseOverNode = null;
            }
        };
        AppView.prototype.updateTree = function () {
            var _this = this;
            $('.tree li:has(ul)').addClass('parent_li').find(' > span');
            $('.tree li.parent_li > span').on('click', function (e) {
                var children = $(this).parent('li.parent_li').find(' > ul > li');
                if (children.is(":visible")) {
                    children.hide('fast');
                    $(this).find(' > i').addClass(AppView.PLUS_SIGN_GLYPHICON).removeClass(AppView.MINUS_SIGN_GLYPHICON);
                }
                else {
                    children.show('fast');
                    $(this).find(' > i').addClass(AppView.MINUS_SIGN_GLYPHICON).removeClass(AppView.PLUS_SIGN_GLYPHICON);
                }
                e.stopPropagation();
            });
            $('.tree li > span').on('mouseenter', function (e) {
                _this.resetLastMouseOverNode();
                var nodeInfo = $(e.target).closest("li").find(".node-info"); //:first
                nodeInfo.css("display", "inline-block");
                _this.lastMouseOverNode = nodeInfo;
                e.stopPropagation();
            });
            $(".node-info").on("click", function (e) {
                _this.selectAll($(e.target)[0]);
                e.stopPropagation();
            });
        };
        AppView.prototype.selectAll = function (el) {
            if (typeof window.getSelection != "undefined" && typeof document.createRange != "undefined") {
                var range = document.createRange();
                range.selectNodeContents(el);
                var sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            }
            else if (typeof document.selection != "undefined" && typeof document.body.createTextRange != "undefined") {
                var textRange = document.body.createTextRange();
                textRange.moveToElementText(el);
                textRange.select();
            }
        };
        AppView.prototype.dropzoneClick = function () {
            $("#dropzone-dialog").click();
        };
        AppView.prototype.expandCollapseAll = function () {
            var allChildrenSelector = $('.tree ul > li > ul');
            var btn = $("#expand-collapse-btn");
            if (btn.text() == AppView.TEXT_COLLAPSE) {
                allChildrenSelector.find("li").hide();
                btn.text(AppView.TEXT_EXPAND);
                var s = $("." + AppView.MINUS_SIGN_GLYPHICON);
                s.removeClass(AppView.MINUS_SIGN_GLYPHICON);
                s.addClass(AppView.PLUS_SIGN_GLYPHICON);
            }
            else {
                allChildrenSelector.find("li").show();
                btn.text(AppView.TEXT_COLLAPSE);
                var s = $("." + AppView.PLUS_SIGN_GLYPHICON);
                s.removeClass(AppView.PLUS_SIGN_GLYPHICON);
                s.addClass(AppView.MINUS_SIGN_GLYPHICON);
            }
        };
        AppView.prototype.download = function () {
            var blob = new Blob([this.generatedTreePlain.join("\n")], { type: "text/plain;charset=utf-8" });
            saveAs(blob, this.lastFilename + ".txt");
        };
        //Used for saving classes and method counts in package tree
        AppView.TREE_META_NODE = "__metadata";
        AppView.PLUS_SIGN_GLYPHICON = "glyphicon-plus-sign";
        AppView.MINUS_SIGN_GLYPHICON = "glyphicon-minus-sign";
        AppView.TEXT_EXPAND = "Expand";
        AppView.TEXT_COLLAPSE = "Collapse";
        return AppView;
    })();
    ApkMethodCount.AppView = AppView;
    String.prototype.repeat = function (num) {
        return new Array(num + 1).join(this);
    };
})(ApkMethodCount || (ApkMethodCount = {}));
new ApkMethodCount.AppView();
///<reference path="js/ts/main.ts"/> 
//# sourceMappingURL=main.js.map