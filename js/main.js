var TREE_COUNT_NAME = "__count";
var EMPTY_PACKAGE_NAME = "(empty)";
var PLUS_SIGN_GLYPHICON = "glyphicon-plus-sign";
var MINUS_SIGN_GLYPHICON = "glyphicon-minus-sign";
var START_LEVEL_VISIBLE = 1;

var collapsed = true;
var generatedTreePlain = [];
var lastFilename = "classes_stats";

var fileReaderOpts = {
    readAsDefault: "ArrayBuffer", on: {
        load: function (e, file) {
            lastFilename = extractFileNameWithoutExt(file.name);
            setIsLoading(true);
            setTimeout(function () {
                renderPackages(loadDexFile(e.target.result));

                $("#output-box").fadeIn();
                $(".nouploadinfo").hide();
                $("#dropzone").animate({ height: 50}, 500);
                $("#success-box").show();
            }, 50);
        }
    }
};

String.prototype.repeat = function( num )  {
    return new Array( num + 1 ).join( this );
};

function setIsLoading(isLoading) {
    var dropText = $("#drop-text");
    var loading = $("#drop-loading");
    if (isLoading) {
        dropText.hide();
        loading.show();
    } else {
        dropText.show();
        loading.hide();
    }
}

function loadDexFile(arrayBuffer) {
    var dexFile = new DexFile(arrayBuffer);
    var methodRefs = dexFile.getMethodRefs();
    var treemap = [];

    for (var i = 0; i < methodRefs.length; i++) { //methodRefs.length
        var className = methodRefs[i].className;
        var packageName = DexFile.packageNameOnly(className);
        var packageNameParts = packageName.split(".");

        //Empty package
        if (packageNameParts.length == 1 && packageNameParts[0].length == 0) {
            packageNameParts[0] = EMPTY_PACKAGE_NAME;
        }

        //Build tree map of classes
        var currentNode = treemap[packageNameParts[0]];
        if (typeof currentNode === "undefined") {
            currentNode = treemap[packageNameParts[0]] = {};
        }

        for (var j = 0; j < packageNameParts.length; j++) {
            if (j >= 1) {
                if (typeof currentNode[packageNameParts[j]] === "undefined") {
                    currentNode[packageNameParts[j]] = [];
                }
                currentNode = currentNode[packageNameParts[j]];
            }
            currentNode[TREE_COUNT_NAME] = ++currentNode[TREE_COUNT_NAME] || 1;
        }
    }

    //Sort
    var sortedMap = Object.keys(treemap).sort(function (a,b) { return treemap[b][TREE_COUNT_NAME] - treemap[a][TREE_COUNT_NAME]; });

    return {tree:treemap, sorted:sortedMap, methodsCount:dexFile.getHeader().methodIdsSize};
}

function renderPackages(data) {
    var treeBuilder = [];
    var treeView = $("#package-tree");

    generatedTreePlain = [];
    generatedTreePlain.push("Total methods count: " + data.methodsCount);
    generatedTreePlain.push("");

    treeBuilder.push("<ul>");
    recursiveRenderPackage(treeBuilder, data.tree, 0);
    treeBuilder.push("</ul>");

    treeView.empty();
    treeView.append(treeBuilder.join(""));
    updateTree();

    $("#method-count-total").text(data.methodsCount);

    setIsLoading(false);
}

function recursiveRenderPackage(treeBuilder, node, level) {
    var sortedNode = Object.keys(node).sort(function (a,b) { return node[b][TREE_COUNT_NAME] - node[a][TREE_COUNT_NAME]; });

    for (var item in sortedNode) {
        item = sortedNode[item];
        if (item != TREE_COUNT_NAME) {
            var displayStyle = level <= START_LEVEL_VISIBLE ? "visible" : "none";
            var nodeSign = "<i class='glyphicon " + (level == 0 ? MINUS_SIGN_GLYPHICON : PLUS_SIGN_GLYPHICON) + "'></i> ";
            var hasChildren = Object.keys(node[item]).length > 1;
            var count = node[item][TREE_COUNT_NAME];

            generatedTreePlain.push("\t".repeat(level) + item + " ["+count+"]");

            treeBuilder.push("<li style='display: " + displayStyle + "'><span> " + (hasChildren ? nodeSign : "") + item +
            " <span class='badge'>" + count + "</span></span>");

            if (hasChildren) {
                treeBuilder.push("<ul>");
                level++;
                recursiveRenderPackage(treeBuilder, node[item], level);
                level--;
                treeBuilder.push("</ul>");
            }
            treeBuilder.push("</li>");

        }
    }
}

function expandCollapseAll() {
    collapsed = !collapsed;
    var allChildrenSelector = $('.tree ul > li > ul');

    if (collapsed) {
        allChildrenSelector.find("li").hide();
        $("#expand-collapse-btn").text("Expand");
        var s = $("." + MINUS_SIGN_GLYPHICON);

        s.removeClass(MINUS_SIGN_GLYPHICON);
        s.addClass(PLUS_SIGN_GLYPHICON);
    } else {
        allChildrenSelector.find("li").show();
        $("#expand-collapse-btn").text("Collapse");
        var s = $("." + PLUS_SIGN_GLYPHICON);

        s.removeClass(PLUS_SIGN_GLYPHICON);
        s.addClass(MINUS_SIGN_GLYPHICON);
    }
}

function download() {
    var blob = new Blob([generatedTreePlain.join("\n")], {type: "text/plain;charset=utf-8"});
    saveAs(blob, lastFilename + ".txt");
}

function extractFileNameWithoutExt(filename) {
    var dotIndex = filename.lastIndexOf(".");
    if (dotIndex > -1) {
        return filename.substr(0, dotIndex);
    } else {
        return filename;
    }
}

function dropzoneClick() {
    $("#dropzone-dialog").click();
}

if (typeof FileReader === "undefined") {
    $('#dropzone, #dropzone-dialog').hide();
    $('#compat-error').show();
} else {
    $('#dropzone, #dropzone-dialog').fileReaderJS(fileReaderOpts);
}

function updateTree() {
    $('.tree li:has(ul)').addClass('parent_li').find(' > span').attr('title', 'Collapse this branch');

    $('.tree li.parent_li > span').on('click', function (e) {
        var children = $(this).parent('li.parent_li').find(' > ul > li');
        if (children.is(":visible")) {
            children.hide('fast');
            $(this).attr('title', 'Expand').find(' > i').addClass(PLUS_SIGN_GLYPHICON).removeClass(MINUS_SIGN_GLYPHICON);
        } else {
            children.show('fast');
            $(this).attr('title', 'Collapse').find(' > i').addClass(MINUS_SIGN_GLYPHICON).removeClass(PLUS_SIGN_GLYPHICON);
        }
        e.stopPropagation();
    });

}