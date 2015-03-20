var TREE_COUNT_NAME = "__count";
var EMPTY_PACKAGE_NAME = "(empty)";
var PLUS_SIGN_GLYPHICON = "glyphicon-plus-sign";
var MINUS_SIGN_GLYPHICON = "glyphicon-minus-sign";
var START_LEVEL_VISIBLE = 1;

var collapsed = true;
var generatedTreePlain = [];
var lastFilename = "classes_stats";
var treeView = $("#package-tree");

var fileReaderOpts = {
    readAsDefault: "ArrayBuffer", on: {
        load: function (e, file) {
            lastFilename = extractFileNameWithoutExt(file.name);
            setIsLoading(true);
            setTimeout(function () {
                var errorText = $(".alert-danger.box");
                try {
                    var data = loadDexFile(e.target.result);
                    renderPackages(data);
                    $("#output-box").fadeIn();
                    $(".nouploadinfo").hide();
                    $("#dropzone").delay(50).animate({ height: 50}, 500);
                    $("#success-box").show();
                    errorText.hide();
                } catch (exception) {
                    console.log(exception);
                    setIsLoading(false);
                    errorText.text("Not a valid APK!");
                    errorText.show();
                    $("#output-box").hide();
                    $("#success-box").hide();
                }
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

    return {tree:treemap, sorted:sortedMap, methodsCount:methodRefs.length};
}

function renderPackages(data) {
    var treeBuilder = [];

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

var nodeTraverse = [];

function recursiveRenderPackage(treeBuilder, node, level) {
    var sortedNode = Object.keys(node).sort(function (a,b) { return node[b][TREE_COUNT_NAME] - node[a][TREE_COUNT_NAME]; });
    for (var item in sortedNode) {
        item = sortedNode[item];
        if (item != TREE_COUNT_NAME) {
            var displayStyle = level <= START_LEVEL_VISIBLE ? "visible" : "none";
            var nodeSign = "<i class='glyphicon " + (level == 0 ? MINUS_SIGN_GLYPHICON : PLUS_SIGN_GLYPHICON) + "'></i> ";
            var hasChildren = Object.keys(node[item]).length > 1;
            var count = node[item][TREE_COUNT_NAME];
            var extraSpan = "";

            if (level > 0) {
                extraSpan = nodeTraverse.join(".") + "." + item;
            }

            generatedTreePlain.push("\t".repeat(level) + item + " ["+count+"]");

            treeBuilder.push("<li style='display: " + displayStyle + "'><span> " + (hasChildren ? nodeSign : "") + item +
            " <span class='badge'>" + count + "</span></span> <p class='node-info'>" + extraSpan + "</p>");
            if (hasChildren) {
                nodeTraverse.push(item);
                treeBuilder.push("<ul>");
                level++;
                recursiveRenderPackage(treeBuilder, node[item], level);
                level--;
                treeBuilder.push("</ul>");
                nodeTraverse.pop();
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

    var lastMouseOverNode = null;

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

    $('.tree li > span').on('mouseenter', function (e) {
        if (lastMouseOverNode != null) {
            lastMouseOverNode.css("display", "none");
        }
        var nodeInfo = $(e.target).closest("li").find(".node-info:first");
        nodeInfo.css("display", "inline-block");
        lastMouseOverNode = nodeInfo;
        e.stopPropagation();
    });

    $(".node-info").on("click", function (e) {
        selectAll($(e.target)[0]);
        e.stopPropagation();
    });

}

function selectAll(el) {
    if (typeof window.getSelection != "undefined" && typeof document.createRange != "undefined") {
        var range = document.createRange();
        range.selectNodeContents(el);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    } else if (typeof document.selection != "undefined" && typeof document.body.createTextRange != "undefined") {
        var textRange = document.body.createTextRange();
        textRange.moveToElementText(el);
        textRange.select();
    }
}