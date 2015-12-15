///<reference path="dexformat.ts"/>

namespace DexFormat {

    export enum AccessFlags {
        ACC_PUBLIC = 0x1, ACC_PRIVATE = 0x2, ACC_PROTECTED = 0x4, ACC_STATIC = 0x8, ACC_FINAL = 0x10,
        ACC_SYNCHRONIZED = 0x20, ACC_VOLATILE = 0x40, ACC_BRIDGE = 0x40, ACC_TRANSIENT = 0x80, ACC_VARARGS = 0x80,
        ACC_NATIVE = 0x100, ACC_INTERFACE = 0x200, ACC_ABSTRACT = 0x400, ACC_STRICT = 0x800, ACC_SYNTHETIC = 0x1000,
        ACC_ANNOTATION = 0x2000, ACC_ENUM = 0x4000, ACC_CONSTRUCTOR = 0x10000, ACC_DECLARED_SYNCHRONIZED = 0x20000
    }

    abstract class BaseDef {
        protected static NO_INDEX = 0xffffffff;
        protected reader:DexFileReader;

        constructor(reader:DexFileReader) {
            this.reader = reader;
        }
    }

    abstract class ClassBaseDef extends BaseDef {
        protected classIdx:number;


        public getClassData():ClassDef {
            return this.reader.getClass(this.classIdx);
        }

        public getClassType():TypeDef {
            return this.reader.getType(this.classIdx);
        }

        public getClassIdx():number {
            return this.classIdx;
        }
    }

    export class TypeDef extends BaseDef {
        private descriptorIdx:number;
        private internal:boolean;

        constructor(reader:DexFileReader, descriptorIdx:number) {
            super(reader);
            this.descriptorIdx = descriptorIdx;
        }

        public getDescriptor():string {
            return this.reader.getString(this.descriptorIdx);
        }

        public setInternal(internal: boolean):void {
            this.internal = internal;
        }

        public isInternal():boolean {
            return this.internal;
        }
    }

    export class ProtoDef extends BaseDef {
        private shortyIdx:number;
        private returnTypeIdx:number;
        private parametersOff:number;

        constructor(reader:DexFileReader, shortyIdx:number, returnTypeIdx:number, parametersOff:number) {
            super(reader);
            this.shortyIdx = shortyIdx;
            this.returnTypeIdx = returnTypeIdx;
            this.parametersOff = parametersOff;
        }

        public getShorty():string {
            return this.reader.getString(this.shortyIdx);
        }

        public getParametersOff():number {
            return this.parametersOff;
        }

        public getReturnType():TypeDef {
            return this.reader.getType(this.returnTypeIdx);
        }
    }

    export class FieldDef extends ClassBaseDef {
        private typeIdx:number;
        private nameIdx:number;

        constructor(reader:DexFileReader, classIdx:number, typeIdx:number, nameIdx:number) {
            super(reader);
            this.classIdx = classIdx;
            this.typeIdx = typeIdx;
            this.nameIdx = nameIdx;
        }

        public getName():string {
            return this.reader.getString(this.nameIdx);
        }

        public getType():TypeDef {
            return this.reader.getType(this.typeIdx);
        }
    }

    export class MethodDef extends ClassBaseDef {
        private protoIdx:number;
        private nameIdx:number;

        constructor(reader:DexFileReader, classIdx:number, protoIdx:number, nameIdx:number) {
            super(reader);
            this.classIdx = classIdx;
            this.protoIdx = protoIdx;
            this.nameIdx = nameIdx;
        }

        public getName():string {
            return this.reader.getString(this.nameIdx);
        }

        public getProto():ProtoDef {
            return this.reader.getProto(this.protoIdx);
        }
    }

    export class ClassDef extends BaseDef {
        private classIdx:number;
        private accessFlags:number;
        private superclassIdx:number;
        private interfacesOff:number;
        private sourceFileIdx:number;
        private annotationsOff:number;
        private classDataOff:number;
        private staticValuesOff:number;

        constructor(reader:DexFileReader, classIdx:number, accessFlags:number, superclassIdx:number, interfacesOff:number,
                    sourceFileIdx:number, annotationsOff:number, classDataOff:number, staticValuesOff:number) {
            super(reader);
            this.classIdx = classIdx;
            this.accessFlags = accessFlags;
            this.superclassIdx = superclassIdx;
            this.interfacesOff = interfacesOff;
            this.sourceFileIdx = sourceFileIdx;
            this.annotationsOff = annotationsOff;
            this.classDataOff = classDataOff;
            this.staticValuesOff = staticValuesOff;
        }

        public getClassIdx():number {
            return this.classIdx;
        }

        public isAccessFlag(flag:AccessFlags):boolean {
            return (this.accessFlags & flag) == flag;
        }

        public getSourceFileName():string {
            return this.reader.getString(this.sourceFileIdx);
        }

        public getClassType():TypeDef {
            return this.reader.getType(this.classIdx);
        }

        public getSuperclassType():TypeDef {
            if (this.superclassIdx == BaseDef.NO_INDEX) {
                return null;
            } else {
                return this.reader.getType(this.superclassIdx);
            }
        }

        public getInterfacesOff():number {
            return this.interfacesOff;
        }

        public getAnnotationsOff():number {
            return this.annotationsOff;
        }

        public getClassDataOff():number {
            return this.classDataOff;
        }

        public getStaticValuesOff():number {
            return this.staticValuesOff;
        }
    }
}