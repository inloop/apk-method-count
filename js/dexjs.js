//dexjs 0.1
//Written by Juraj Novák (inloop.eu)
//based on https://github.com/mihaip/dex-method-counts

var DEX_FILE_MAGIC = [0x64, 0x65, 0x78, 0x0a, 0x30, 0x33, 0x36, 0x00];
var DEX_FILE_MAGIC_API_13 = [0x64, 0x65, 0x78, 0x0a, 0x30, 0x33, 0x35, 0x00];
var ENDIAN_CONSTANT = 0x12345678;
var REVERSE_ENDIAN_CONSTANT = 0x78563412;
var CLASSES_FILENAME = /classes\d*\.dex/;

var dexFile = {
    fileSize: {},
    headerSize: {},
    endianTag: {},
    linkSize: {},
    linkOff: {},
    mapOff: {},
    stringIdsSize: {},
    stringIdsOff: {},
    typeIdsSize: {},
    typeIdsOff: {},
    protoIdsSize: {},
    protoIdsOff: {},
    fieldIdsSize: {},
    fieldIdsOff: {},
    methodIdsSize: {},
    methodIdsOff: {},
    classDefsSize: {},
    classDefsOff: {},
    dataSize: {},
    dataOff: {}
};

var strings = [], types = [], protos = [], fields = [], methods = [], classes = [];

var DexFile = function (arrayBuffer) {
    var zip = new JSZip(arrayBuffer);
    var files = zip.file(CLASSES_FILENAME);
    //Check if contains at least one dex file
    if (files.length > 0) {
        for (var i = 0; i < files.length; i++) {
            var dv = new jDataView(files[i].asArrayBuffer());
            if (isValidDexFile(dv.getBytes(8))) {
                parseHeader(dv);
                loadStrings(dv);
                loadTypes(dv);
                loadProtos(dv);
                loadFields(dv);
                loadMethods(dv);
                loadClasses(dv);

                markInternalClasses();
            } else {
                throw "APK not compatible!";
            }
        }
    } else {
        throw "APK does not contain .dex file(s)!";
    }
};

DexFile.prototype.getExternalReferences = function () {
    var sparseRefs = [];
    var count = 0;

    for (var i = 0; i < types.length; i++) {
        if (!types[i].internal) {
            sparseRefs[i] = strings[types[i]];
            count++;
        }
    }

    addExternalFieldReferences(sparseRefs);
    addExternalMethodReferences(sparseRefs);

    // crunch out the sparseness
    var classRefs = [];
    var idx = 0;
    for (var i = 0; i < types.length; i++) {
        if (sparseRefs[i] != null)
            classRefs[idx++] = sparseRefs[i];
    }

    return classRefs;
};

DexFile.prototype.getMethodRefs = function () {
    var refs = [];
    for (var i = 0; i < methods.length; i++) {
        var method = methods[i];
        refs[i] = {};
        refs[i].className = classNameFromTypeIndex(method.classIdx);
        refs[i].argArray = argArrayFromProtoIndex(method.protoIdx);
        refs[i].returnType = returnTypeFromProtoIndex(method.protoIdx);
        refs[i].name = strings[method.nameIdx];
    }
    return refs;
};

DexFile.prototype.getHeader = function () {
    return dexFile;
};

function parseHeader(dv) {
    //Read endian tag first
    dv.seek(8 + 4 + 20 + 4 + 4);
    dexFile.endianTag = dv.getInt32();
    if (dexFile.endianTag === ENDIAN_CONSTANT) {
        dv._littleEndian = false;
    } else if (dexFile.endianTag === REVERSE_ENDIAN_CONSTANT) {
        dv._littleEndian = true;
    } else {
        throw "APK read error (endianTag)!";
    }

    //Read header
    dv.seek(8 + 4 + 20);
    dexFile.fileSize = dv.getInt32();
    dexFile.headerSize = dv.getInt32();
    dexFile.endianTag = dv.getInt32();
    dexFile.linkSize = dv.getInt32();
    dexFile.linkOff = dv.getInt32();
    dexFile.mapOff = dv.getInt32();
    dexFile.stringIdsSize = dv.getInt32();
    dexFile.stringIdsOff = dv.getInt32();
    dexFile.typeIdsSize = dv.getInt32();
    dexFile.typeIdsOff = dv.getInt32();
    dexFile.protoIdsSize = dv.getInt32();
    dexFile.protoIdsOff = dv.getInt32();
    dexFile.fieldIdsSize = dv.getInt32();
    dexFile.fieldIdsOff = dv.getInt32();
    dexFile.methodIdsSize = dv.getInt32();
    dexFile.methodIdsOff = dv.getInt32();
    dexFile.classDefsSize = dv.getInt32();
    dexFile.classDefsOff = dv.getInt32();
    dexFile.dataSize = dv.getInt32();
    dexFile.dataOff = dv.getInt32();
}

function loadStrings(dv) {
    var curStrings = [];
    var offsets = [];
    dv.seek(dexFile.stringIdsOff);

    for (var i = 0; i < dexFile.stringIdsSize; i++) {
        offsets[i] = dv.getInt32();
    }

    dv.seek(offsets[0]);
    for (var i = 0; i < dexFile.stringIdsSize; i++) {
        dv.seek(offsets[i]);
        curStrings[i] = dv.readStringUtf();
    }
    strings = strings.concat(curStrings);
}

function loadTypes(dv) {
    var curTypes = [];
    dv.seek(dexFile.typeIdsOff);
    for (var i = 0; i < dexFile.typeIdsSize; i++) {
        curTypes[i] = dv.getInt32();
    }
    types = types.concat(curTypes);
}

function loadProtos(dv) {
    var curProtos = [];
    dv.seek(dexFile.protoIdsOff);
    for (var i = 0; i < dexFile.protoIdsSize; i++) {
        curProtos[i] = {};
        curProtos[i].shortyIdx = dv.getInt32();
        curProtos[i].returnTypeIdx = dv.getInt32();
        curProtos[i].parametersOff = dv.getInt32();
    }

    for (var i = 0; i < dexFile.protoIdsSize; i++) {
        var offset = curProtos[i].parametersOff;
        curProtos[i].types = [];
        if (offset != 0) {

            dv.seek(offset);
            var size = dv.getInt32();       // #of entries in list

            for (var j = 0; j < size; j++) {
                curProtos[i].types[j] = dv.getInt16() & 0xffff;
            }
        }
    }
    protos = protos.concat(curProtos)
}

function loadFields(dv) {
    var curFields = [];
    dv.seek(dexFile.fieldIdsOff);
    for (var i = 0; i < dexFile.fieldIdsSize; i++) {
        curFields[i] = {};
        curFields[i].classIdx = dv.getInt16() & 0xffff;
        curFields[i].typeIdx = dv.getInt16() & 0xffff;
        curFields[i].nameIdx = dv.getInt32();
    }
    fields = fields.concat(curFields);
}

function loadMethods(dv) {
    var curMethods = [];
    dv.seek(dexFile.methodIdsOff);
    for (var i = 0; i < dexFile.methodIdsSize; i++) {
        curMethods[i] = {};
        curMethods[i].classIdx = dv.getInt16() & 0xffff;
        curMethods[i].protoIdx = dv.getInt16() & 0xffff;
        curMethods[i].nameIdx = dv.getInt32();
    }
    methods = methods.concat(curMethods);
}

function loadClasses(dv) {
    var curClasses = [];
    dv.seek(dexFile.classDefsOff);
    for (var i = 0; i < dexFile.classDefsSize; i++) {
        curClasses[i] = {};
        curClasses[i].classIdx = dv.getInt32();
        curClasses[i].accessFlags = dv.getInt32();
        curClasses[i].superclassIdx = dv.getInt32();
        curClasses[i].interfacesOff = dv.getInt32();
        curClasses[i].sourceFileIdx = dv.getInt32();
        curClasses[i].annotationsOff = dv.getInt32();
        curClasses[i].classDataOff = dv.getInt32();
        curClasses[i].staticValuesOff = dv.getInt32();
    }
    classes = classes.concat(curClasses);
}

function addExternalFieldReferences(sparseRefs) {
    for (var i = 0; i < fields.length; i++) {
        if (!types[fields[i].classIdx].internal) {
            var newFieldRef = {};
            newFieldRef.className = classNameFromTypeIndex(fields[i].classIdx);
            newFieldRef.typeName = classNameFromTypeIndex(fields[i].typeIdx);
            newFieldRef.fieldName = strings[fields[i].nameIdx];
            if (typeof sparseRefs[fields[i].classIdx] === "string") {
                sparseRefs[fields[i].classIdx] = {};
            }
            if (typeof sparseRefs[fields[i].classIdx].fields === "undefined") {
                sparseRefs[fields[i].classIdx].fields = [];
            }

            sparseRefs[fields[i].classIdx].fields.push(newFieldRef);
        }
    }
}

function addExternalMethodReferences(sparseRefs) {
    for (var i = 0; i < methods.length; i++) {
        if (!types[methods[i].classIdx].internal) {
            var newMethodRef = {};
            newMethodRef.className = classNameFromTypeIndex(methods[i].classIdx);
            newMethodRef.protoName = argArrayFromProtoIndex(methods[i].protoIdx);
            newMethodRef.returnName = returnTypeFromProtoIndex(methods[i].protoIdx);
            newMethodRef.methodName = strings[methods[i].nameIdx];
            if (typeof sparseRefs[methods[i].classIdx] === "string") {
                sparseRefs[methods[i].classIdx] = {};
            }
            if (typeof sparseRefs[methods[i].classIdx].methods === "undefined") {
                sparseRefs[methods[i].classIdx].methods = [];
            }

            sparseRefs[methods[i].classIdx].methods.push(newMethodRef);
        }
    }
}

function markInternalClasses() {
    for (var i = classes.length - 1; i >= 0; i--) {
        types[classes[i].classIdx].internal = true;
    }

    for (var i = 0; i < types.length; i++) {
        var className = strings[types[i]];

        if (className.length == 1) {
            // primitive class
            types[i].internal = true;
        } else if (className.charAt(0) == '[') {
            types[i].internal = true;
        }
    }
}

function classNameFromTypeIndex(idx) {
    return strings[types[idx]];
}

function returnTypeFromProtoIndex(idx) {
    return strings[types[protos[idx].returnTypeIdx]];
}

function argArrayFromProtoIndex(idx) {
    var result = [];

    for (var i = 0; i < protos[idx].types.length; i++) {
        result[i] = strings[types[protos[idx].types[i]]];
    }

    return result;
}


function isValidDexFile(bytes) {
    for (var i = 0; i < bytes.length; i++) {
        if (!(bytes[i] === DEX_FILE_MAGIC[i] || bytes[i] === DEX_FILE_MAGIC_API_13[i])) {
            return false;
        }
    }
    return true;
}

DexFile.primitiveTypeLabel = function (typeChar) {
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
};

DexFile.packageNameOnly = function (typeName) {
    var dotted = DexFile.descriptorToDot(typeName);
    var end = dotted.lastIndexOf(".");
    if (end < 0) {
        return "";
    } else {
        return dotted.substring(0, end);
    }
};

DexFile.descriptorToDot = function (descr) {
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
        descr = DexFile.primitiveTypeLabel(descr.charAt(offset));
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
};

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