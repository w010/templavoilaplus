var browserPos = null;
var sortableSourceIndex = null;
var sortableSourceList = null;
var sortableDestinationIndex = null;
var sortableDestinationList = null;
var sortableSourceListInProcess = null;

//var TYPO3 = TYPO3 || {}; TYPO3.jQuery = TYPO3.jQuery || jQuery.noConflict(true);
// const $ = require('jquery');

function setFormValueOpenBrowser(url, mode, params) {
    var url = url + "&mode=" + mode + "&bparams=" + params;

    browserWin = window.open(url, "templavoilareferencebrowser", "height=350,width=" + (mode == "db" ? 650 : 600) + ",status=0,menubar=0,resizable=1,scrollbars=1");
    browserWin.focus();
}
    
function setFormValueFromBrowseWin(fName, value, label, exclusiveValues) {
    if (value) {
        var ret = value.split('_');
        var rid = ret.pop();
        ret = ret.join('_');
        browserPos.href = browserPos.rel.replace('%23%23%23', ret + ':' + rid);
        jumpToUrl(browserPos.href);
    }
}

function jumpToUrl(URL) {
    window.location.href = URL;
    return false;
}

function setHighlight(id) {
    top.fsMod.recentIds["web"] = id;
    top.fsMod.navFrameHighlightedID["web"] = "pages" + id + "_" + top.fsMod.currentBank;	// For highlighting

    if (top.content && top.content.nav_frame && top.content.nav_frame.refresh_nav) {
        top.content.nav_frame.refresh_nav();
    }
}

    function editList(table, idList) {
        var list = "";
    
        // Checking how many is checked, how many is not
        var pointer = 0;
        var pos = idList.indexOf(",");
        while (pos != -1) {
            if (cbValue(table + "|" + idList.substr(pointer, pos - pointer))) {
                list += idList.substr(pointer, pos - pointer) + ",";
            }
            pointer = pos + 1;
            pos = idList.indexOf(",", pointer);
        }
        if (cbValue(table + "|" + idList.substr(pointer))) {
            list += idList.substr(pointer) + ",";
        }
    
        return list ? list : idList;
    }
    
    // --- drag & drop ----
    
    var sortable_currentItem;
    // Needs also:
    // sortable_linkParameters = mod1/index.php -- $this->link_getParameters()
    
    function sortable_unhideRecord(it, command) {
        jumpToUrl(command);
    }
    
    function sortable_hideRecord(it, command) {
        if (!sortable_removeHidden) {
            return jumpToUrl(command);
        }
    
        while ((typeof it.className == "undefined") || (it.className.search(/tpm-element(?!-)/) == -1)) {
            it = it.parentNode;
        }
        new Ajax.Request(command);
        new Effect.Fade(it,
            { duration: 0.5,
              afterFinish: sortable_hideRecordCallBack
            });
    }
    
    function sortable_hideRecordCallBack(obj) {
        var el = obj.element;
    
        while (el.lastChild) {
            el.removeChild(el.lastChild);
        }
    }

    function sortable_unlinkRecordCallBack(obj)
    {
        const $ = require('jquery');
        
        var $parentSortable = $(obj).parents('.ui-sortable');
        obj.remove();
        sortable_updateItemButtons('#' + $parentSortable[0].id)
    }
    
    function sortable_unlinkRecord(pointer, id, elementPointer)
    {
        const $ = require('jquery');
        
        var item = $('#' + id)[0];
        showInProgress(item);
    
        new $.ajax({
            url: TYPO3.settings.ajaxUrls['templavoilaplus_record_unlink'],
            type: 'post',
            cache: false,
            data: {
                'unlink': pointer
            },
            success: function(result) {
                // @TODO insert unlinked element into sidebar, so it is viewable without reloading?
                // This was functional in older TV releases.
    
                // Fade out unlinked element
                new $('#' + id).fadeTo('fast', 0.0, function() {
                    sortable_unlinkRecordCallBack($(this))
                });
            },
            error: function(result) {
                showError(item);
            }
        });
    }
    
    function sortable_unlinkRecordSidebarCallBack(pointer) {
        const $ = require('jquery');
        
        var childNodes = $('tx_templavoilaplus_mod1_sidebar-bar').childElements();
        var innerHeight = 0;
        for (var i = 0; i < childNodes.length; i++) {
            innerHeight += childNodes[i].getHeight();
        }
        $('tx_templavoilaplus_mod1_sidebar-bar').morph(
            { height: innerHeight + 'px'},
            {
                duration: 0.1,
                afterFinish: function() {
                    $('tx_templavoilaplus_mod1_sidebar-bar').setStyle({height: 'auto'});
                    if (pointer && $(pointer)) {
                        $(pointer).highlight();
                    }
                }
            }
        );
    }
    
    function sortable_updateItemButtons(listSelector)
    {
        const $ = require('jquery');
        
        var sortOrder = $(listSelector).sortable('toArray');
        sortOrder.forEach(function(itemId, position) {
            var newPos = sortable_containers[listSelector] + (position + 1);
            $('#' + itemId).find('a').each(function() {
                $this = $(this);
                if ($this.hasClass('tpm-new')) {
                    this.setAttribute('onclick', this.getAttribute('onclick').replace(/&parentRecord=[^&]+/, "&parentRecord=" + newPos));
                }
                if ($this.hasClass('tpm-browse')) {
                    if (this.rel) {
                        this.rel = this.rel.replace(/&destination=[^&]+/, "&destination=" + newPos);
                    }
                }
                if ($this.hasClass('tpm-delete')) {
                    this.href = this.href.replace(/&deleteRecord=[^&]+/, "&deleteRecord=" + newPos);
                }
                if ($this.hasClass('tpm-unlink')) {
                    this.href = this.href.replace(/unlinkRecord\('[^']+'/, "unlinkRecord(\'" + newPos + "\'");
                }
                if ($this.hasClass('tpm-cut') || $this.hasClass('tpm-copy') || $this.hasClass('tpm-ref') ) {
                    //this.setAttribute('onclick',  encodeURI(decodeURI(this.getAttribute('onclick')).replace(/CB\[el\]\[([^\]]+)\]=[^&]+/, "CB[el][$1]=" + newPos)));
    
                    this.setAttribute('onclick',  this.getAttribute('onclick').replace(/CB\[el\]\[([^\]]+)\]=[^&]+/, "CB[el][$1]=" + newPos));
                }
                if ($this.hasClass('tpm-pasteAfter') || $this.hasClass('tpm-pasteSubRef')) {
                    this.href = this.href.replace(/&destination=[^&]+/, "&destination=" + newPos);
                }
                if ($this.hasClass('tpm-makeLocal')) {
                    this.href = this.href.replace(/&makeLocalRecord=[^&]+/, "&makeLocalRecord=" + newPos);
                }
            });
        });
    }
    
function sortable_update(element, sortOrder)
{
    // NO +1, sortOrder starts with 0 and TV+ starts with 1, but we need index of element
    // after which we move this element
    sortableDestinationIndex = sortOrder.indexOf(element.id);
//     element.data('lastPredecessor', element.prev());
}

function sortable_start(list, element, sortOrder)
{
    // +1 as sortOrder starts with 0 but TV+ starts with 1
    sortableSourceIndex = sortOrder.indexOf(element.id) + 1;
    sortableSourceList = '#' + list.id;

    // NO +1, sortOrder starts with 0 and TV+ starts with 1, but we need index of element
    // after which we move this element
    sortableDestinationIndex = sortOrder.indexOf(element.id);
    sortableDestinationList = '#' + list.id;
}

function sortable_stop(item, placeholder)
{
    const $ = require('jquery');

    var source = sortable_containers[sortableSourceList] + sortableSourceIndex;
    var destination = sortable_containers[sortableDestinationList] + sortableDestinationIndex;

    showInProgress(item);

    sortableSourceListInProcess = sortableSourceList;

    new $.ajax({
        async: true,
        url: TYPO3.settings.ajaxUrls['templavoilaplus_record_move'],
        type: 'post',
        cache: false,
        data: {
            'source': source,
            'destination': destination
        },
        success: function(result) {
            showSuccess(item);
            sortable_updateItemButtons(sortableDestinationList);
            if (sortableSourceList != sortableDestinationList) {
                sortable_updateItemButtons(sortableSourceList);

            }
        },
        error: function(result) {
            $(sortableSourceListInProcess).sortable( "cancel" );
            showError(item);
        },
        complete: function(result) {
            sortableSourceListInProcess = null;
            sortableSourceIndex = null;
            sortableSourceList = null;
            sortableDestinationIndex = null;
            sortableDestinationList = null;
        }
    });
}

function sortable_receive(list)
{
    // We switch into another list
    sortableDestinationList = '#' + list.id;
}

function tv_createSortable(container, connectWith)
{
    const $ = require('jquery');

    var $sortingContainer = $(container);
    $sortingContainer.sortable(
    {
        connectWith: connectWith, /* '.ui-sortable' ?? */
        handle: '.sortable_handle',
        items: '> .sortableItem',
        //zIndex: '4000',
        tolerance: 'pointer',
        opacity: 0.5,
        revert: true,
        start: function (event, ui) {
            sortable_start($(this)[0], ui.item[0], $(this).sortable('toArray'));
        },
        update: function (event, ui) {
            sortable_update(ui.item[0], $(this).sortable('toArray'));
        },
        stop: function (event, ui) {
            sortable_stop(ui.item[0], ui.placeholder);
            $($(ui.item[0]).data('lastParent')).after(ui.item[0]);
        },
        receive: function (event, ui) {
            sortable_receive($(this)[0]);
        },
        forcePlaceholderSize: true,
        placeholder: 'drag-placeholder'
    });
    $sortingContainer.disableSelection();
}

function showInProgress(item)
{
    const $ = require('jquery');
    
    $('.tpm-titlebar', item)
        .addClass("toYellow");
}

function showSuccess(item)
{
    const $ = require('jquery');
    
    // flash green
    $('.tpm-titlebar', item)
        .off()
        .addClass("flashGreen")
        .removeClass("toYellow")
        .one("animationend webkitAnimationEnd", function(){ $('.tpm-titlebar', item).removeClass("flashGreen"); });
}

// flash red
function showError(item)
{
    const $ = require('jquery');
    
    $('.tpm-titlebar', item)
        .off()
        .addClass("flashRed")
        .removeClass("toYellow")
        .one("animationend webkitAnimationEnd", function(){ $('.tpm-titlebar', item).removeClass("flashRed"); });
}
