///<reference path="main.ts"/>

namespace ApkMethodCount {

    export class Model {

        private static EMPTY_PACKAGE_NAME:string = "(empty)";
        private static ICON_INTERFACE:string = "interface";
        private static ICON_CLASS:string = "class";
        private static ICON_ENUM:string = "enum";
        private static ICON_REF:string = "reference";
        private static INNER_CLASS_REGEX:RegExp = /^\d+$/;

        public static START_LEVEL_VISIBLE:number = 1;
        public static TREE_CLASS_LEVEL:number = 1;

        private currentTreemap:ClassDataWrapper[];

        public getCurrentTreemap():ClassDataWrapper[] {
            return this.currentTreemap;
        }

        public loadDexFile(arrayBuffer:ArrayBuffer):LoadedDexData {
            var dexFile = new DexFileReader(arrayBuffer);
            var methodRefs = dexFile.getMethodRefs();
            var treemap:ClassDataWrapper[] = [];

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
                    if (typeof currentNode[AppView.TREE_META_NODE] === "undefined") {
                        metaNode = currentNode[AppView.TREE_META_NODE] = new PackageNodeMetaData();
                    } else {
                        metaNode = currentNode[AppView.TREE_META_NODE];
                    }
                    metaNode.incrementMethodCount();

                    //Save classes and their method counts
                    if (j >= Model.TREE_CLASS_LEVEL) { //ignore root package level
                        metaNode.addClassAndIncrement(classIdx, new ClassDataWrapper(classType, classData));
                    }
                }
            }

            //Save reference for later (showing package details)
            this.currentTreemap = treemap;

            return {tree: treemap, methodsCount: methodRefs.length, multidex: dexFile.isMultidex()};
        }

        public isInnerClassFromName(className:string):boolean {
            return className.match(Model.INNER_CLASS_REGEX) !==null;
        }

        public formatType(className:string, classData:ClassDataWrapper):string {
            var classDef = classData.getClassDef();
            if (classDef != null) {
                if (classDef.isAccessFlag(DexFormat.AccessFlags.ACC_INTERFACE)) {
                    return Model.ICON_INTERFACE;
                } else if (classDef.isAccessFlag(DexFormat.AccessFlags.ACC_ENUM)) {
                    return Model.ICON_ENUM;
                } else {
                    return Model.ICON_CLASS;
                }
            } else if (className.lastIndexOf("[]") == className.length - 2) {
                return Model.ICON_ENUM;
            } else {
                return Model.ICON_REF;
            }

        }

        public extractFileNameWithoutExt(filename:string):string {
            var dotIndex = filename.lastIndexOf(".");
            if (dotIndex > -1) {
                return filename.substr(0, dotIndex);
            } else {
                return filename;
            }
        }
    }

    export class ClassDataWrapper {
        private classType:TypeDef;
        private classDef:ClassDef;
        private methodCount:number = 0;

        constructor(classType:TypeDef, classDef:ClassDef) {
            this.classType = classType;
            this.classDef = classDef;
        }

        public incrementMethodCount():void {
            this.methodCount++;
        }

        public getMethodCount():number {
            return this.methodCount;
        }

        public getClassType():TypeDef {
            return this.classType;
        }

        public getClassDef():ClassDef {
            return this.classDef;
        }
    }

    export class PackageNodeMetaData {
        private classes:ClassDataWrapper[] = [];
        private count:number = 0;

        public incrementMethodCount():void {
            this.count++;
        }

        public addClassAndIncrement(idx:number, classWrapper:ClassDataWrapper):void {
            if (typeof this.classes[idx] === "undefined") {
                this.classes[idx] = classWrapper;
            }
            this.classes[idx].incrementMethodCount();
        }

        public getCount():number {
            return this.count;
        }

        public getClassWrapper(idx:number):ClassDataWrapper {
            return this.classes[idx];
        }

        public getSortedClasses():string[] {
            return Object.keys(this.classes).sort((a, b) => {
                return this.classes[b].getMethodCount() - this.classes[a].getMethodCount();
            });
        }
    }

}