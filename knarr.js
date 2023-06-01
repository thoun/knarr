var DEFAULT_ZOOM_LEVELS = [0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];
var ZoomManager = /** @class */ (function () {
    /**
     * Place the settings.element in a zoom wrapper and init zoomControls.
     *
     * @param settings: a `ZoomManagerSettings` object
     */
    function ZoomManager(settings) {
        var _this = this;
        var _a, _b, _c, _d, _e;
        this.settings = settings;
        if (!settings.element) {
            throw new DOMException('You need to set the element to wrap in the zoom element');
        }
        this.zoomLevels = (_a = settings.zoomLevels) !== null && _a !== void 0 ? _a : DEFAULT_ZOOM_LEVELS;
        this._zoom = this.settings.defaultZoom || 1;
        if (this.settings.localStorageZoomKey) {
            var zoomStr = localStorage.getItem(this.settings.localStorageZoomKey);
            if (zoomStr) {
                this._zoom = Number(zoomStr);
            }
        }
        this.wrapper = document.createElement('div');
        this.wrapper.id = 'bga-zoom-wrapper';
        this.wrapElement(this.wrapper, settings.element);
        this.wrapper.appendChild(settings.element);
        settings.element.classList.add('bga-zoom-inner');
        if ((_b = settings.smooth) !== null && _b !== void 0 ? _b : true) {
            settings.element.dataset.smooth = 'true';
            settings.element.addEventListener('transitionend', function () { return _this.zoomOrDimensionChanged(); });
        }
        if ((_d = (_c = settings.zoomControls) === null || _c === void 0 ? void 0 : _c.visible) !== null && _d !== void 0 ? _d : true) {
            this.initZoomControls(settings);
        }
        if (this._zoom !== 1) {
            this.setZoom(this._zoom);
        }
        window.addEventListener('resize', function () {
            var _a;
            _this.zoomOrDimensionChanged();
            if ((_a = _this.settings.autoZoom) === null || _a === void 0 ? void 0 : _a.expectedWidth) {
                _this.setAutoZoom();
            }
        });
        if (window.ResizeObserver) {
            new ResizeObserver(function () { return _this.zoomOrDimensionChanged(); }).observe(settings.element);
        }
        if ((_e = this.settings.autoZoom) === null || _e === void 0 ? void 0 : _e.expectedWidth) {
            this.setAutoZoom();
        }
    }
    Object.defineProperty(ZoomManager.prototype, "zoom", {
        /**
         * Returns the zoom level
         */
        get: function () {
            return this._zoom;
        },
        enumerable: false,
        configurable: true
    });
    ZoomManager.prototype.setAutoZoom = function () {
        var _this = this;
        var _a, _b, _c;
        var zoomWrapperWidth = document.getElementById('bga-zoom-wrapper').clientWidth;
        if (!zoomWrapperWidth) {
            setTimeout(function () { return _this.setAutoZoom(); }, 200);
            return;
        }
        var expectedWidth = (_a = this.settings.autoZoom) === null || _a === void 0 ? void 0 : _a.expectedWidth;
        var newZoom = this.zoom;
        while (newZoom > this.zoomLevels[0] && newZoom > ((_c = (_b = this.settings.autoZoom) === null || _b === void 0 ? void 0 : _b.minZoomLevel) !== null && _c !== void 0 ? _c : 0) && zoomWrapperWidth / newZoom < expectedWidth) {
            newZoom = this.zoomLevels[this.zoomLevels.indexOf(newZoom) - 1];
        }
        if (this._zoom == newZoom) {
            if (this.settings.localStorageZoomKey) {
                localStorage.setItem(this.settings.localStorageZoomKey, '' + this._zoom);
            }
        }
        else {
            this.setZoom(newZoom);
        }
    };
    /**
     * Set the zoom level. Ideally, use a zoom level in the zoomLevels range.
     * @param zoom zool level
     */
    ZoomManager.prototype.setZoom = function (zoom) {
        var _a, _b, _c, _d;
        if (zoom === void 0) { zoom = 1; }
        this._zoom = zoom;
        if (this.settings.localStorageZoomKey) {
            localStorage.setItem(this.settings.localStorageZoomKey, '' + this._zoom);
        }
        var newIndex = this.zoomLevels.indexOf(this._zoom);
        (_a = this.zoomInButton) === null || _a === void 0 ? void 0 : _a.classList.toggle('disabled', newIndex === this.zoomLevels.length - 1);
        (_b = this.zoomOutButton) === null || _b === void 0 ? void 0 : _b.classList.toggle('disabled', newIndex === 0);
        this.settings.element.style.transform = zoom === 1 ? '' : "scale(".concat(zoom, ")");
        (_d = (_c = this.settings).onZoomChange) === null || _d === void 0 ? void 0 : _d.call(_c, this._zoom);
        this.zoomOrDimensionChanged();
    };
    /**
     * Call this method for the browsers not supporting ResizeObserver, everytime the table height changes, if you know it.
     * If the browsert is recent enough (>= Safari 13.1) it will just be ignored.
     */
    ZoomManager.prototype.manualHeightUpdate = function () {
        if (!window.ResizeObserver) {
            this.zoomOrDimensionChanged();
        }
    };
    /**
     * Everytime the element dimensions changes, we update the style. And call the optional callback.
     */
    ZoomManager.prototype.zoomOrDimensionChanged = function () {
        var _a, _b;
        this.settings.element.style.width = "".concat(this.wrapper.getBoundingClientRect().width / this._zoom, "px");
        this.wrapper.style.height = "".concat(this.settings.element.getBoundingClientRect().height, "px");
        (_b = (_a = this.settings).onDimensionsChange) === null || _b === void 0 ? void 0 : _b.call(_a, this._zoom);
    };
    /**
     * Simulates a click on the Zoom-in button.
     */
    ZoomManager.prototype.zoomIn = function () {
        if (this._zoom === this.zoomLevels[this.zoomLevels.length - 1]) {
            return;
        }
        var newIndex = this.zoomLevels.indexOf(this._zoom) + 1;
        this.setZoom(newIndex === -1 ? 1 : this.zoomLevels[newIndex]);
    };
    /**
     * Simulates a click on the Zoom-out button.
     */
    ZoomManager.prototype.zoomOut = function () {
        if (this._zoom === this.zoomLevels[0]) {
            return;
        }
        var newIndex = this.zoomLevels.indexOf(this._zoom) - 1;
        this.setZoom(newIndex === -1 ? 1 : this.zoomLevels[newIndex]);
    };
    /**
     * Changes the color of the zoom controls.
     */
    ZoomManager.prototype.setZoomControlsColor = function (color) {
        if (this.zoomControls) {
            this.zoomControls.dataset.color = color;
        }
    };
    /**
     * Set-up the zoom controls
     * @param settings a `ZoomManagerSettings` object.
     */
    ZoomManager.prototype.initZoomControls = function (settings) {
        var _this = this;
        var _a, _b, _c, _d, _e, _f;
        this.zoomControls = document.createElement('div');
        this.zoomControls.id = 'bga-zoom-controls';
        this.zoomControls.dataset.position = (_b = (_a = settings.zoomControls) === null || _a === void 0 ? void 0 : _a.position) !== null && _b !== void 0 ? _b : 'top-right';
        this.zoomOutButton = document.createElement('button');
        this.zoomOutButton.type = 'button';
        this.zoomOutButton.addEventListener('click', function () { return _this.zoomOut(); });
        if ((_c = settings.zoomControls) === null || _c === void 0 ? void 0 : _c.customZoomOutElement) {
            settings.zoomControls.customZoomOutElement(this.zoomOutButton);
        }
        else {
            this.zoomOutButton.classList.add("bga-zoom-out-icon");
        }
        this.zoomInButton = document.createElement('button');
        this.zoomInButton.type = 'button';
        this.zoomInButton.addEventListener('click', function () { return _this.zoomIn(); });
        if ((_d = settings.zoomControls) === null || _d === void 0 ? void 0 : _d.customZoomInElement) {
            settings.zoomControls.customZoomInElement(this.zoomInButton);
        }
        else {
            this.zoomInButton.classList.add("bga-zoom-in-icon");
        }
        this.zoomControls.appendChild(this.zoomOutButton);
        this.zoomControls.appendChild(this.zoomInButton);
        this.wrapper.appendChild(this.zoomControls);
        this.setZoomControlsColor((_f = (_e = settings.zoomControls) === null || _e === void 0 ? void 0 : _e.color) !== null && _f !== void 0 ? _f : 'black');
    };
    /**
     * Wraps an element around an existing DOM element
     * @param wrapper the wrapper element
     * @param element the existing element
     */
    ZoomManager.prototype.wrapElement = function (wrapper, element) {
        element.parentNode.insertBefore(wrapper, element);
        wrapper.appendChild(element);
    };
    return ZoomManager;
}());
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
/**
 * Jump to entry.
 */
var JumpToEntry = /** @class */ (function () {
    function JumpToEntry(
    /**
     * Label shown on the entry. For players, it's player name.
     */
    label, 
    /**
     * HTML Element id, to scroll into view when clicked.
     */
    targetId, 
    /**
     * Any element that is useful to customize the link.
     * Basic ones are 'color' and 'colorback'.
     */
    data) {
        if (data === void 0) { data = {}; }
        this.label = label;
        this.targetId = targetId;
        this.data = data;
    }
    return JumpToEntry;
}());
var JumpToManager = /** @class */ (function () {
    function JumpToManager(game, settings) {
        var _a, _b, _c;
        this.game = game;
        this.settings = settings;
        var entries = __spreadArray(__spreadArray([], ((_a = settings === null || settings === void 0 ? void 0 : settings.topEntries) !== null && _a !== void 0 ? _a : []), true), ((_b = settings === null || settings === void 0 ? void 0 : settings.playersEntries) !== null && _b !== void 0 ? _b : this.createEntries(Object.values(game.gamedatas.players))), true);
        this.createPlayerJumps(entries);
        var folded = (_c = settings === null || settings === void 0 ? void 0 : settings.defaultFolded) !== null && _c !== void 0 ? _c : false;
        if (settings === null || settings === void 0 ? void 0 : settings.localStorageFoldedKey) {
            var localStorageValue = localStorage.getItem(settings.localStorageFoldedKey);
            if (localStorageValue) {
                folded = localStorageValue == 'true';
            }
        }
        document.getElementById('bga-jump-to_controls').classList.toggle('folded', folded);
    }
    JumpToManager.prototype.createPlayerJumps = function (entries) {
        var _this = this;
        var _a, _b, _c, _d;
        document.getElementById("game_play_area_wrap").insertAdjacentHTML('afterend', "\n        <div id=\"bga-jump-to_controls\">        \n            <div id=\"bga-jump-to_toggle\" class=\"bga-jump-to_link ".concat((_b = (_a = this.settings) === null || _a === void 0 ? void 0 : _a.entryClasses) !== null && _b !== void 0 ? _b : '', " toggle\" style=\"--color: ").concat((_d = (_c = this.settings) === null || _c === void 0 ? void 0 : _c.toggleColor) !== null && _d !== void 0 ? _d : 'black', "\">\n                \u21D4\n            </div>\n        </div>"));
        document.getElementById("bga-jump-to_toggle").addEventListener('click', function () { return _this.jumpToggle(); });
        entries.forEach(function (entry) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            var html = "<div id=\"bga-jump-to_".concat(entry.targetId, "\" class=\"bga-jump-to_link ").concat((_b = (_a = _this.settings) === null || _a === void 0 ? void 0 : _a.entryClasses) !== null && _b !== void 0 ? _b : '', "\">");
            if ((_d = (_c = _this.settings) === null || _c === void 0 ? void 0 : _c.showEye) !== null && _d !== void 0 ? _d : true) {
                html += "<div class=\"eye\"></div>";
            }
            if (((_f = (_e = _this.settings) === null || _e === void 0 ? void 0 : _e.showAvatar) !== null && _f !== void 0 ? _f : true) && ((_g = entry.data) === null || _g === void 0 ? void 0 : _g.id)) {
                var cssUrl = (_h = entry.data) === null || _h === void 0 ? void 0 : _h.avatarUrl;
                if (!cssUrl) {
                    var img = document.getElementById("avatar_".concat(entry.data.id));
                    var url = img === null || img === void 0 ? void 0 : img.src;
                    // ? Custom image : Bga Image
                    //url = url.replace('_32', url.indexOf('data/avatar/defaults') > 0 ? '' : '_184');
                    if (url) {
                        cssUrl = "url('".concat(url, "')");
                    }
                }
                if (cssUrl) {
                    html += "<div class=\"bga-jump-to_avatar\" style=\"--avatar-url: ".concat(cssUrl, ";\"></div>");
                }
            }
            html += "\n                <span class=\"bga-jump-to_label\">".concat(entry.label, "</span>\n            </div>");
            //
            document.getElementById("bga-jump-to_controls").insertAdjacentHTML('beforeend', html);
            var entryDiv = document.getElementById("bga-jump-to_".concat(entry.targetId));
            Object.getOwnPropertyNames((_j = entry.data) !== null && _j !== void 0 ? _j : []).forEach(function (key) {
                entryDiv.dataset[key] = entry.data[key];
                entryDiv.style.setProperty("--".concat(key), entry.data[key]);
            });
            entryDiv.addEventListener('click', function () { return _this.jumpTo(entry.targetId); });
        });
        var jumpDiv = document.getElementById("bga-jump-to_controls");
        jumpDiv.style.marginTop = "-".concat(Math.round(jumpDiv.getBoundingClientRect().height / 2), "px");
    };
    JumpToManager.prototype.jumpToggle = function () {
        var _a;
        var jumpControls = document.getElementById('bga-jump-to_controls');
        jumpControls.classList.toggle('folded');
        if ((_a = this.settings) === null || _a === void 0 ? void 0 : _a.localStorageFoldedKey) {
            localStorage.setItem(this.settings.localStorageFoldedKey, jumpControls.classList.contains('folded').toString());
        }
    };
    JumpToManager.prototype.jumpTo = function (targetId) {
        document.getElementById(targetId).scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    };
    JumpToManager.prototype.getOrderedPlayers = function (unorderedPlayers) {
        var _this = this;
        var players = unorderedPlayers.sort(function (a, b) { return Number(a.playerNo) - Number(b.playerNo); });
        var playerIndex = players.findIndex(function (player) { return Number(player.id) === Number(_this.game.player_id); });
        var orderedPlayers = playerIndex > 0 ? __spreadArray(__spreadArray([], players.slice(playerIndex), true), players.slice(0, playerIndex), true) : players;
        return orderedPlayers;
    };
    JumpToManager.prototype.createEntries = function (players) {
        var orderedPlayers = this.getOrderedPlayers(players);
        return orderedPlayers.map(function (player) { return new JumpToEntry(player.name, "player-table-".concat(player.id), {
            'color': '#' + player.color,
            'colorback': player.color_back ? '#' + player.color_back : null,
            'id': player.id,
        }); });
    };
    return JumpToManager;
}());
var BgaAnimation = /** @class */ (function () {
    function BgaAnimation(animationFunction, settings) {
        this.animationFunction = animationFunction;
        this.settings = settings;
        this.played = null;
        this.result = null;
        this.playWhenNoAnimation = false;
    }
    return BgaAnimation;
}());
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
/**
 * Just use playSequence from animationManager
 *
 * @param animationManager the animation manager
 * @param animation a `BgaAnimation` object
 * @returns a promise when animation ends
 */
function attachWithAnimation(animationManager, animation) {
    var _a;
    var settings = animation.settings;
    var element = settings.animation.settings.element;
    var fromRect = element.getBoundingClientRect();
    settings.animation.settings.fromRect = fromRect;
    settings.attachElement.appendChild(element);
    (_a = settings.afterAttach) === null || _a === void 0 ? void 0 : _a.call(settings, element, settings.attachElement);
    return animationManager.play(settings.animation);
}
var BgaAttachWithAnimation = /** @class */ (function (_super) {
    __extends(BgaAttachWithAnimation, _super);
    function BgaAttachWithAnimation(settings) {
        var _this = _super.call(this, attachWithAnimation, settings) || this;
        _this.playWhenNoAnimation = true;
        return _this;
    }
    return BgaAttachWithAnimation;
}(BgaAnimation));
/**
 * Just use playSequence from animationManager
 *
 * @param animationManager the animation manager
 * @param animation a `BgaAnimation` object
 * @returns a promise when animation ends
 */
function cumulatedAnimations(animationManager, animation) {
    return animationManager.playSequence(animation.settings.animations);
}
var BgaCumulatedAnimation = /** @class */ (function (_super) {
    __extends(BgaCumulatedAnimation, _super);
    function BgaCumulatedAnimation(settings) {
        var _this = _super.call(this, cumulatedAnimations, settings) || this;
        _this.playWhenNoAnimation = true;
        return _this;
    }
    return BgaCumulatedAnimation;
}(BgaAnimation));
/**
 * Linear slide of the element from origin to destination.
 *
 * @param animationManager the animation manager
 * @param animation a `BgaAnimation` object
 * @returns a promise when animation ends
 */
function slideToAnimation(animationManager, animation) {
    var promise = new Promise(function (success) {
        var _a, _b, _c, _d;
        var settings = animation.settings;
        var element = settings.element;
        var _e = getDeltaCoordinates(element, settings), x = _e.x, y = _e.y;
        var duration = (_a = settings === null || settings === void 0 ? void 0 : settings.duration) !== null && _a !== void 0 ? _a : 500;
        var originalZIndex = element.style.zIndex;
        var originalTransition = element.style.transition;
        element.style.zIndex = "".concat((_b = settings === null || settings === void 0 ? void 0 : settings.zIndex) !== null && _b !== void 0 ? _b : 10);
        var timeoutId = null;
        var cleanOnTransitionEnd = function () {
            element.style.zIndex = originalZIndex;
            element.style.transition = originalTransition;
            success();
            element.removeEventListener('transitioncancel', cleanOnTransitionEnd);
            element.removeEventListener('transitionend', cleanOnTransitionEnd);
            document.removeEventListener('visibilitychange', cleanOnTransitionEnd);
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
        var cleanOnTransitionCancel = function () {
            var _a;
            element.style.transition = "";
            element.offsetHeight;
            element.style.transform = (_a = settings === null || settings === void 0 ? void 0 : settings.finalTransform) !== null && _a !== void 0 ? _a : null;
            element.offsetHeight;
            cleanOnTransitionEnd();
        };
        element.addEventListener('transitioncancel', cleanOnTransitionEnd);
        element.addEventListener('transitionend', cleanOnTransitionEnd);
        document.addEventListener('visibilitychange', cleanOnTransitionCancel);
        element.offsetHeight;
        element.style.transition = "transform ".concat(duration, "ms linear");
        element.offsetHeight;
        element.style.transform = "translate(".concat(-x, "px, ").concat(-y, "px) rotate(").concat((_c = settings === null || settings === void 0 ? void 0 : settings.rotationDelta) !== null && _c !== void 0 ? _c : 0, "deg) scale(").concat((_d = settings.scale) !== null && _d !== void 0 ? _d : 1, ")");
        // safety in case transitionend and transitioncancel are not called
        timeoutId = setTimeout(cleanOnTransitionEnd, duration + 100);
    });
    return promise;
}
var BgaSlideToAnimation = /** @class */ (function (_super) {
    __extends(BgaSlideToAnimation, _super);
    function BgaSlideToAnimation(settings) {
        return _super.call(this, slideToAnimation, settings) || this;
    }
    return BgaSlideToAnimation;
}(BgaAnimation));
/**
 * Linear slide of the element from origin to destination.
 *
 * @param animationManager the animation manager
 * @param animation a `BgaAnimation` object
 * @returns a promise when animation ends
 */
function slideAnimation(animationManager, animation) {
    var promise = new Promise(function (success) {
        var _a, _b, _c, _d;
        var settings = animation.settings;
        var element = settings.element;
        var _e = getDeltaCoordinates(element, settings), x = _e.x, y = _e.y;
        var duration = (_a = settings === null || settings === void 0 ? void 0 : settings.duration) !== null && _a !== void 0 ? _a : 500;
        var originalZIndex = element.style.zIndex;
        var originalTransition = element.style.transition;
        element.style.zIndex = "".concat((_b = settings === null || settings === void 0 ? void 0 : settings.zIndex) !== null && _b !== void 0 ? _b : 10);
        element.style.transition = null;
        element.offsetHeight;
        element.style.transform = "translate(".concat(-x, "px, ").concat(-y, "px) rotate(").concat((_c = settings === null || settings === void 0 ? void 0 : settings.rotationDelta) !== null && _c !== void 0 ? _c : 0, "deg)");
        var timeoutId = null;
        var cleanOnTransitionEnd = function () {
            element.style.zIndex = originalZIndex;
            element.style.transition = originalTransition;
            success();
            element.removeEventListener('transitioncancel', cleanOnTransitionEnd);
            element.removeEventListener('transitionend', cleanOnTransitionEnd);
            document.removeEventListener('visibilitychange', cleanOnTransitionEnd);
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
        var cleanOnTransitionCancel = function () {
            var _a;
            element.style.transition = "";
            element.offsetHeight;
            element.style.transform = (_a = settings === null || settings === void 0 ? void 0 : settings.finalTransform) !== null && _a !== void 0 ? _a : null;
            element.offsetHeight;
            cleanOnTransitionEnd();
        };
        element.addEventListener('transitioncancel', cleanOnTransitionCancel);
        element.addEventListener('transitionend', cleanOnTransitionEnd);
        document.addEventListener('visibilitychange', cleanOnTransitionCancel);
        element.offsetHeight;
        element.style.transition = "transform ".concat(duration, "ms linear");
        element.offsetHeight;
        element.style.transform = (_d = settings === null || settings === void 0 ? void 0 : settings.finalTransform) !== null && _d !== void 0 ? _d : null;
        // safety in case transitionend and transitioncancel are not called
        timeoutId = setTimeout(cleanOnTransitionEnd, duration + 100);
    });
    return promise;
}
var BgaSlideAnimation = /** @class */ (function (_super) {
    __extends(BgaSlideAnimation, _super);
    function BgaSlideAnimation(settings) {
        return _super.call(this, slideAnimation, settings) || this;
    }
    return BgaSlideAnimation;
}(BgaAnimation));
function shouldAnimate(settings) {
    var _a;
    return document.visibilityState !== 'hidden' && !((_a = settings === null || settings === void 0 ? void 0 : settings.game) === null || _a === void 0 ? void 0 : _a.instantaneousMode);
}
/**
 * Return the x and y delta, based on the animation settings;
 *
 * @param settings an `AnimationSettings` object
 * @returns a promise when animation ends
 */
function getDeltaCoordinates(element, settings) {
    var _a;
    if (!settings.fromDelta && !settings.fromRect && !settings.fromElement) {
        throw new Error("[bga-animation] fromDelta, fromRect or fromElement need to be set");
    }
    var x = 0;
    var y = 0;
    if (settings.fromDelta) {
        x = settings.fromDelta.x;
        y = settings.fromDelta.y;
    }
    else {
        var originBR = (_a = settings.fromRect) !== null && _a !== void 0 ? _a : settings.fromElement.getBoundingClientRect();
        // TODO make it an option ?
        var originalTransform = element.style.transform;
        element.style.transform = '';
        var destinationBR = element.getBoundingClientRect();
        element.style.transform = originalTransform;
        x = (destinationBR.left + destinationBR.right) / 2 - (originBR.left + originBR.right) / 2;
        y = (destinationBR.top + destinationBR.bottom) / 2 - (originBR.top + originBR.bottom) / 2;
    }
    if (settings.scale) {
        x /= settings.scale;
        y /= settings.scale;
    }
    return { x: x, y: y };
}
function logAnimation(animationManager, animation) {
    var settings = animation.settings;
    var element = settings.element;
    if (element) {
        console.log(animation, settings, element, element.getBoundingClientRect(), element.style.transform);
    }
    else {
        console.log(animation, settings);
    }
    return Promise.resolve(false);
}
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var AnimationManager = /** @class */ (function () {
    /**
     * @param game the BGA game class, usually it will be `this`
     * @param settings: a `AnimationManagerSettings` object
     */
    function AnimationManager(game, settings) {
        this.game = game;
        this.settings = settings;
        this.zoomManager = settings === null || settings === void 0 ? void 0 : settings.zoomManager;
        if (!game) {
            throw new Error('You must set your game as the first parameter of AnimationManager');
        }
    }
    AnimationManager.prototype.getZoomManager = function () {
        return this.zoomManager;
    };
    /**
     * Set the zoom manager, to get the scale of the current game.
     *
     * @param zoomManager the zoom manager
     */
    AnimationManager.prototype.setZoomManager = function (zoomManager) {
        this.zoomManager = zoomManager;
    };
    AnimationManager.prototype.getSettings = function () {
        return this.settings;
    };
    /**
     * Returns if the animations are active. Animation aren't active when the window is not visible (`document.visibilityState === 'hidden'`), or `game.instantaneousMode` is true.
     *
     * @returns if the animations are active.
     */
    AnimationManager.prototype.animationsActive = function () {
        return document.visibilityState !== 'hidden' && !this.game.instantaneousMode;
    };
    /**
     * Plays an animation if the animations are active. Animation aren't active when the window is not visible (`document.visibilityState === 'hidden'`), or `game.instantaneousMode` is true.
     *
     * @param animation the animation to play
     * @returns the animation promise.
     */
    AnimationManager.prototype.play = function (animation) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        return __awaiter(this, void 0, void 0, function () {
            var settings, _m;
            return __generator(this, function (_o) {
                switch (_o.label) {
                    case 0:
                        animation.played = animation.playWhenNoAnimation || this.animationsActive();
                        if (!animation.played) return [3 /*break*/, 2];
                        settings = animation.settings;
                        (_a = settings.animationStart) === null || _a === void 0 ? void 0 : _a.call(settings, animation);
                        (_b = settings.element) === null || _b === void 0 ? void 0 : _b.classList.add((_c = settings.animationClass) !== null && _c !== void 0 ? _c : 'bga-animations_animated');
                        animation.settings = __assign(__assign({}, animation.settings), { duration: (_e = (_d = this.settings) === null || _d === void 0 ? void 0 : _d.duration) !== null && _e !== void 0 ? _e : 500, scale: (_g = (_f = this.zoomManager) === null || _f === void 0 ? void 0 : _f.zoom) !== null && _g !== void 0 ? _g : undefined });
                        _m = animation;
                        return [4 /*yield*/, animation.animationFunction(this, animation)];
                    case 1:
                        _m.result = _o.sent();
                        (_j = (_h = animation.settings).animationEnd) === null || _j === void 0 ? void 0 : _j.call(_h, animation);
                        (_k = settings.element) === null || _k === void 0 ? void 0 : _k.classList.remove((_l = settings.animationClass) !== null && _l !== void 0 ? _l : 'bga-animations_animated');
                        return [3 /*break*/, 3];
                    case 2: return [2 /*return*/, Promise.resolve(animation)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Plays multiple animations in parallel.
     *
     * @param animations the animations to play
     * @returns a promise for all animations.
     */
    AnimationManager.prototype.playParallel = function (animations) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, Promise.all(animations.map(function (animation) { return _this.play(animation); }))];
            });
        });
    };
    /**
     * Plays multiple animations in sequence (the second when the first ends, ...).
     *
     * @param animations the animations to play
     * @returns a promise for all animations.
     */
    AnimationManager.prototype.playSequence = function (animations) {
        return __awaiter(this, void 0, void 0, function () {
            var result, others;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!animations.length) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.play(animations[0])];
                    case 1:
                        result = _a.sent();
                        return [4 /*yield*/, this.playSequence(animations.slice(1))];
                    case 2:
                        others = _a.sent();
                        return [2 /*return*/, __spreadArray([result], others, true)];
                    case 3: return [2 /*return*/, Promise.resolve([])];
                }
            });
        });
    };
    /**
     * Plays multiple animations with a delay between each animation start.
     *
     * @param animations the animations to play
     * @param delay the delay (in ms)
     * @returns a promise for all animations.
     */
    AnimationManager.prototype.playWithDelay = function (animations, delay) {
        return __awaiter(this, void 0, void 0, function () {
            var promise;
            var _this = this;
            return __generator(this, function (_a) {
                promise = new Promise(function (success) {
                    var promises = [];
                    var _loop_1 = function (i) {
                        setTimeout(function () {
                            promises.push(_this.play(animations[i]));
                            if (i == animations.length - 1) {
                                Promise.all(promises).then(function (result) {
                                    success(result);
                                });
                            }
                        }, i * delay);
                    };
                    for (var i = 0; i < animations.length; i++) {
                        _loop_1(i);
                    }
                });
                return [2 /*return*/, promise];
            });
        });
    };
    /**
     * Attach an element to a parent, then play animation from element's origin to its new position.
     *
     * @param animation the animation function
     * @param attachElement the destination parent
     * @returns a promise when animation ends
     */
    AnimationManager.prototype.attachWithAnimation = function (animation, attachElement) {
        var attachWithAnimation = new BgaAttachWithAnimation({
            animation: animation,
            attachElement: attachElement
        });
        return this.play(attachWithAnimation);
    };
    return AnimationManager;
}());
/**
 * The abstract stock. It shouldn't be used directly, use stocks that extends it.
 */
var CardStock = /** @class */ (function () {
    /**
     * @param manager the card manager
     * @param element the stock element (should be an empty HTML Element)
     */
    function CardStock(manager, element, settings) {
        this.manager = manager;
        this.element = element;
        this.settings = settings;
        this.cards = [];
        this.selectedCards = [];
        this.selectionMode = 'none';
        manager.addStock(this);
        element === null || element === void 0 ? void 0 : element.classList.add('card-stock' /*, this.constructor.name.split(/(?=[A-Z])/).join('-').toLowerCase()* doesn't work in production because of minification */);
        this.bindClick();
        this.sort = settings === null || settings === void 0 ? void 0 : settings.sort;
    }
    /**
     * @returns the cards on the stock
     */
    CardStock.prototype.getCards = function () {
        return this.cards.slice();
    };
    /**
     * @returns if the stock is empty
     */
    CardStock.prototype.isEmpty = function () {
        return !this.cards.length;
    };
    /**
     * @returns the selected cards
     */
    CardStock.prototype.getSelection = function () {
        return this.selectedCards.slice();
    };
    /**
     * @returns the selected cards
     */
    CardStock.prototype.isSelected = function (card) {
        var _this = this;
        return this.selectedCards.some(function (c) { return _this.manager.getId(c) == _this.manager.getId(card); });
    };
    /**
     * @param card a card
     * @returns if the card is present in the stock
     */
    CardStock.prototype.contains = function (card) {
        var _this = this;
        return this.cards.some(function (c) { return _this.manager.getId(c) == _this.manager.getId(card); });
    };
    /**
     * @param card a card in the stock
     * @returns the HTML element generated for the card
     */
    CardStock.prototype.getCardElement = function (card) {
        return this.manager.getCardElement(card);
    };
    /**
     * Checks if the card can be added. By default, only if it isn't already present in the stock.
     *
     * @param card the card to add
     * @param settings the addCard settings
     * @returns if the card can be added
     */
    CardStock.prototype.canAddCard = function (card, settings) {
        return !this.contains(card);
    };
    /**
     * Add a card to the stock.
     *
     * @param card the card to add
     * @param animation a `CardAnimation` object
     * @param settings a `AddCardSettings` object
     * @returns the promise when the animation is done (true if it was animated, false if it wasn't)
     */
    CardStock.prototype.addCard = function (card, animation, settings) {
        var _this = this;
        var _a, _b, _c;
        if (!this.canAddCard(card, settings)) {
            return Promise.resolve(false);
        }
        var promise;
        // we check if card is in a stock
        var originStock = this.manager.getCardStock(card);
        var index = this.getNewCardIndex(card);
        var settingsWithIndex = __assign({ index: index }, (settings !== null && settings !== void 0 ? settings : {}));
        var updateInformations = (_a = settingsWithIndex.updateInformations) !== null && _a !== void 0 ? _a : true;
        if (originStock === null || originStock === void 0 ? void 0 : originStock.contains(card)) {
            var element = this.getCardElement(card);
            promise = this.moveFromOtherStock(card, element, __assign(__assign({}, animation), { fromStock: originStock }), settingsWithIndex);
            if (!updateInformations) {
                element.dataset.side = ((_b = settingsWithIndex === null || settingsWithIndex === void 0 ? void 0 : settingsWithIndex.visible) !== null && _b !== void 0 ? _b : this.manager.isCardVisible(card)) ? 'front' : 'back';
            }
        }
        else if ((animation === null || animation === void 0 ? void 0 : animation.fromStock) && animation.fromStock.contains(card)) {
            var element = this.getCardElement(card);
            promise = this.moveFromOtherStock(card, element, animation, settingsWithIndex);
        }
        else {
            var element = this.manager.createCardElement(card, ((_c = settingsWithIndex === null || settingsWithIndex === void 0 ? void 0 : settingsWithIndex.visible) !== null && _c !== void 0 ? _c : this.manager.isCardVisible(card)));
            promise = this.moveFromElement(card, element, animation, settingsWithIndex);
        }
        if (settingsWithIndex.index !== null && settingsWithIndex.index !== undefined) {
            this.cards.splice(index, 0, card);
        }
        else {
            this.cards.push(card);
        }
        if (updateInformations) { // after splice/push
            this.manager.updateCardInformations(card);
        }
        if (!promise) {
            console.warn("CardStock.addCard didn't return a Promise");
            promise = Promise.resolve(false);
        }
        if (this.selectionMode !== 'none') {
            // make selectable only at the end of the animation
            promise.then(function () { var _a; return _this.setSelectableCard(card, (_a = settingsWithIndex.selectable) !== null && _a !== void 0 ? _a : true); });
        }
        return promise;
    };
    CardStock.prototype.getNewCardIndex = function (card) {
        if (this.sort) {
            var otherCards = this.getCards();
            for (var i = 0; i < otherCards.length; i++) {
                var otherCard = otherCards[i];
                if (this.sort(card, otherCard) < 0) {
                    return i;
                }
            }
            return otherCards.length;
        }
        else {
            return undefined;
        }
    };
    CardStock.prototype.addCardElementToParent = function (cardElement, settings) {
        var _a;
        var parent = (_a = settings === null || settings === void 0 ? void 0 : settings.forceToElement) !== null && _a !== void 0 ? _a : this.element;
        if ((settings === null || settings === void 0 ? void 0 : settings.index) === null || (settings === null || settings === void 0 ? void 0 : settings.index) === undefined || !parent.children.length || (settings === null || settings === void 0 ? void 0 : settings.index) >= parent.children.length) {
            parent.appendChild(cardElement);
        }
        else {
            parent.insertBefore(cardElement, parent.children[settings.index]);
        }
    };
    CardStock.prototype.moveFromOtherStock = function (card, cardElement, animation, settings) {
        var promise;
        var element = animation.fromStock.contains(card) ? this.manager.getCardElement(card) : animation.fromStock.element;
        var fromRect = element.getBoundingClientRect();
        this.addCardElementToParent(cardElement, settings);
        this.removeSelectionClassesFromElement(cardElement);
        promise = this.animationFromElement(cardElement, fromRect, {
            originalSide: animation.originalSide,
            rotationDelta: animation.rotationDelta,
            animation: animation.animation,
        });
        // in the case the card was move inside the same stock we don't remove it
        if (animation.fromStock && animation.fromStock != this) {
            animation.fromStock.removeCard(card);
        }
        if (!promise) {
            console.warn("CardStock.moveFromOtherStock didn't return a Promise");
            promise = Promise.resolve(false);
        }
        return promise;
    };
    CardStock.prototype.moveFromElement = function (card, cardElement, animation, settings) {
        var promise;
        this.addCardElementToParent(cardElement, settings);
        if (animation) {
            if (animation.fromStock) {
                promise = this.animationFromElement(cardElement, animation.fromStock.element.getBoundingClientRect(), {
                    originalSide: animation.originalSide,
                    rotationDelta: animation.rotationDelta,
                    animation: animation.animation,
                });
                animation.fromStock.removeCard(card);
            }
            else if (animation.fromElement) {
                promise = this.animationFromElement(cardElement, animation.fromElement.getBoundingClientRect(), {
                    originalSide: animation.originalSide,
                    rotationDelta: animation.rotationDelta,
                    animation: animation.animation,
                });
            }
        }
        else {
            promise = Promise.resolve(false);
        }
        if (!promise) {
            console.warn("CardStock.moveFromElement didn't return a Promise");
            promise = Promise.resolve(false);
        }
        return promise;
    };
    /**
     * Add an array of cards to the stock.
     *
     * @param cards the cards to add
     * @param animation a `CardAnimation` object
     * @param settings a `AddCardSettings` object
     * @param shift if number, the number of milliseconds between each card. if true, chain animations
     */
    CardStock.prototype.addCards = function (cards, animation, settings, shift) {
        if (shift === void 0) { shift = false; }
        return __awaiter(this, void 0, void 0, function () {
            var promises, result, others, _loop_2, i, results;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.manager.animationsActive()) {
                            shift = false;
                        }
                        promises = [];
                        if (!(shift === true)) return [3 /*break*/, 4];
                        if (!cards.length) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.addCard(cards[0], animation, settings)];
                    case 1:
                        result = _a.sent();
                        return [4 /*yield*/, this.addCards(cards.slice(1), animation, settings, shift)];
                    case 2:
                        others = _a.sent();
                        return [2 /*return*/, result || others];
                    case 3: return [3 /*break*/, 5];
                    case 4:
                        if (typeof shift === 'number') {
                            _loop_2 = function (i) {
                                setTimeout(function () { return promises.push(_this.addCard(cards[i], animation, settings)); }, i * shift);
                            };
                            for (i = 0; i < cards.length; i++) {
                                _loop_2(i);
                            }
                        }
                        else {
                            promises = cards.map(function (card) { return _this.addCard(card, animation, settings); });
                        }
                        _a.label = 5;
                    case 5: return [4 /*yield*/, Promise.all(promises)];
                    case 6:
                        results = _a.sent();
                        return [2 /*return*/, results.some(function (result) { return result; })];
                }
            });
        });
    };
    /**
     * Remove a card from the stock.
     *
     * @param card the card to remove
     * @param settings a `RemoveCardSettings` object
     */
    CardStock.prototype.removeCard = function (card, settings) {
        if (this.contains(card) && this.element.contains(this.getCardElement(card))) {
            this.manager.removeCard(card, settings);
        }
        this.cardRemoved(card, settings);
    };
    /**
     * Notify the stock that a card is removed.
     *
     * @param card the card to remove
     * @param settings a `RemoveCardSettings` object
     */
    CardStock.prototype.cardRemoved = function (card, settings) {
        var _this = this;
        var index = this.cards.findIndex(function (c) { return _this.manager.getId(c) == _this.manager.getId(card); });
        if (index !== -1) {
            this.cards.splice(index, 1);
        }
        if (this.selectedCards.find(function (c) { return _this.manager.getId(c) == _this.manager.getId(card); })) {
            this.unselectCard(card);
        }
    };
    /**
     * Remove a set of card from the stock.
     *
     * @param cards the cards to remove
     * @param settings a `RemoveCardSettings` object
     */
    CardStock.prototype.removeCards = function (cards, settings) {
        var _this = this;
        cards.forEach(function (card) { return _this.removeCard(card, settings); });
    };
    /**
     * Remove all cards from the stock.
     * @param settings a `RemoveCardSettings` object
     */
    CardStock.prototype.removeAll = function (settings) {
        var _this = this;
        var cards = this.getCards(); // use a copy of the array as we iterate and modify it at the same time
        cards.forEach(function (card) { return _this.removeCard(card, settings); });
    };
    /**
     * Set if the stock is selectable, and if yes if it can be multiple.
     * If set to 'none', it will unselect all selected cards.
     *
     * @param selectionMode the selection mode
     * @param selectableCards the selectable cards (all if unset). Calls `setSelectableCards` method
     */
    CardStock.prototype.setSelectionMode = function (selectionMode, selectableCards) {
        var _this = this;
        if (selectionMode !== this.selectionMode) {
            this.unselectAll(true);
        }
        this.cards.forEach(function (card) { return _this.setSelectableCard(card, selectionMode != 'none'); });
        this.element.classList.toggle('bga-cards_selectable-stock', selectionMode != 'none');
        this.selectionMode = selectionMode;
        if (selectionMode === 'none') {
            this.getCards().forEach(function (card) { return _this.removeSelectionClasses(card); });
        }
        else {
            this.setSelectableCards(selectableCards !== null && selectableCards !== void 0 ? selectableCards : this.getCards());
        }
    };
    CardStock.prototype.setSelectableCard = function (card, selectable) {
        if (this.selectionMode === 'none') {
            return;
        }
        var element = this.getCardElement(card);
        var selectableCardsClass = this.getSelectableCardClass();
        var unselectableCardsClass = this.getUnselectableCardClass();
        if (selectableCardsClass) {
            element.classList.toggle(selectableCardsClass, selectable);
        }
        if (unselectableCardsClass) {
            element.classList.toggle(unselectableCardsClass, !selectable);
        }
        if (!selectable && this.isSelected(card)) {
            this.unselectCard(card, true);
        }
    };
    /**
     * Set the selectable class for each card.
     *
     * @param selectableCards the selectable cards. If unset, all cards are marked selectable. Default unset.
     */
    CardStock.prototype.setSelectableCards = function (selectableCards) {
        var _this = this;
        if (this.selectionMode === 'none') {
            return;
        }
        var selectableCardsIds = (selectableCards !== null && selectableCards !== void 0 ? selectableCards : this.getCards()).map(function (card) { return _this.manager.getId(card); });
        this.cards.forEach(function (card) {
            return _this.setSelectableCard(card, selectableCardsIds.includes(_this.manager.getId(card)));
        });
    };
    /**
     * Set selected state to a card.
     *
     * @param card the card to select
     */
    CardStock.prototype.selectCard = function (card, silent) {
        var _this = this;
        var _a;
        if (silent === void 0) { silent = false; }
        if (this.selectionMode == 'none') {
            return;
        }
        var element = this.getCardElement(card);
        var selectableCardsClass = this.getSelectableCardClass();
        if (!element.classList.contains(selectableCardsClass)) {
            return;
        }
        if (this.selectionMode === 'single') {
            this.cards.filter(function (c) { return _this.manager.getId(c) != _this.manager.getId(card); }).forEach(function (c) { return _this.unselectCard(c, true); });
        }
        var selectedCardsClass = this.getSelectedCardClass();
        element.classList.add(selectedCardsClass);
        this.selectedCards.push(card);
        if (!silent) {
            (_a = this.onSelectionChange) === null || _a === void 0 ? void 0 : _a.call(this, this.selectedCards.slice(), card);
        }
    };
    /**
     * Set unselected state to a card.
     *
     * @param card the card to unselect
     */
    CardStock.prototype.unselectCard = function (card, silent) {
        var _this = this;
        var _a;
        if (silent === void 0) { silent = false; }
        var element = this.getCardElement(card);
        var selectedCardsClass = this.getSelectedCardClass();
        element.classList.remove(selectedCardsClass);
        var index = this.selectedCards.findIndex(function (c) { return _this.manager.getId(c) == _this.manager.getId(card); });
        if (index !== -1) {
            this.selectedCards.splice(index, 1);
        }
        if (!silent) {
            (_a = this.onSelectionChange) === null || _a === void 0 ? void 0 : _a.call(this, this.selectedCards.slice(), card);
        }
    };
    /**
     * Select all cards
     */
    CardStock.prototype.selectAll = function (silent) {
        var _this = this;
        var _a;
        if (silent === void 0) { silent = false; }
        if (this.selectionMode == 'none') {
            return;
        }
        this.cards.forEach(function (c) { return _this.selectCard(c, true); });
        if (!silent) {
            (_a = this.onSelectionChange) === null || _a === void 0 ? void 0 : _a.call(this, this.selectedCards.slice(), null);
        }
    };
    /**
     * Unelect all cards
     */
    CardStock.prototype.unselectAll = function (silent) {
        var _this = this;
        var _a;
        if (silent === void 0) { silent = false; }
        var cards = this.getCards(); // use a copy of the array as we iterate and modify it at the same time
        cards.forEach(function (c) { return _this.unselectCard(c, true); });
        if (!silent) {
            (_a = this.onSelectionChange) === null || _a === void 0 ? void 0 : _a.call(this, this.selectedCards.slice(), null);
        }
    };
    CardStock.prototype.bindClick = function () {
        var _this = this;
        var _a;
        (_a = this.element) === null || _a === void 0 ? void 0 : _a.addEventListener('click', function (event) {
            var cardDiv = event.target.closest('.card');
            if (!cardDiv) {
                return;
            }
            var card = _this.cards.find(function (c) { return _this.manager.getId(c) == cardDiv.id; });
            if (!card) {
                return;
            }
            _this.cardClick(card);
        });
    };
    CardStock.prototype.cardClick = function (card) {
        var _this = this;
        var _a;
        if (this.selectionMode != 'none') {
            var alreadySelected = this.selectedCards.some(function (c) { return _this.manager.getId(c) == _this.manager.getId(card); });
            if (alreadySelected) {
                this.unselectCard(card);
            }
            else {
                this.selectCard(card);
            }
        }
        (_a = this.onCardClick) === null || _a === void 0 ? void 0 : _a.call(this, card);
    };
    /**
     * @param element The element to animate. The element is added to the destination stock before the animation starts.
     * @param fromElement The HTMLElement to animate from.
     */
    CardStock.prototype.animationFromElement = function (element, fromRect, settings) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var side, cardSides_1, animation, result;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        side = element.dataset.side;
                        if (settings.originalSide && settings.originalSide != side) {
                            cardSides_1 = element.getElementsByClassName('card-sides')[0];
                            cardSides_1.style.transition = 'none';
                            element.dataset.side = settings.originalSide;
                            setTimeout(function () {
                                cardSides_1.style.transition = null;
                                element.dataset.side = side;
                            });
                        }
                        animation = settings.animation;
                        if (animation) {
                            animation.settings.element = element;
                            animation.settings.fromRect = fromRect;
                        }
                        else {
                            animation = new BgaSlideAnimation({ element: element, fromRect: fromRect });
                        }
                        return [4 /*yield*/, this.manager.animationManager.play(animation)];
                    case 1:
                        result = _b.sent();
                        return [2 /*return*/, (_a = result === null || result === void 0 ? void 0 : result.played) !== null && _a !== void 0 ? _a : false];
                }
            });
        });
    };
    /**
     * Set the card to its front (visible) or back (not visible) side.
     *
     * @param card the card informations
     */
    CardStock.prototype.setCardVisible = function (card, visible, settings) {
        this.manager.setCardVisible(card, visible, settings);
    };
    /**
     * Flips the card.
     *
     * @param card the card informations
     */
    CardStock.prototype.flipCard = function (card, settings) {
        this.manager.flipCard(card, settings);
    };
    /**
     * @returns the class to apply to selectable cards. Use class from manager is unset.
     */
    CardStock.prototype.getSelectableCardClass = function () {
        var _a, _b;
        return ((_a = this.settings) === null || _a === void 0 ? void 0 : _a.selectableCardClass) === undefined ? this.manager.getSelectableCardClass() : (_b = this.settings) === null || _b === void 0 ? void 0 : _b.selectableCardClass;
    };
    /**
     * @returns the class to apply to selectable cards. Use class from manager is unset.
     */
    CardStock.prototype.getUnselectableCardClass = function () {
        var _a, _b;
        return ((_a = this.settings) === null || _a === void 0 ? void 0 : _a.unselectableCardClass) === undefined ? this.manager.getUnselectableCardClass() : (_b = this.settings) === null || _b === void 0 ? void 0 : _b.unselectableCardClass;
    };
    /**
     * @returns the class to apply to selected cards. Use class from manager is unset.
     */
    CardStock.prototype.getSelectedCardClass = function () {
        var _a, _b;
        return ((_a = this.settings) === null || _a === void 0 ? void 0 : _a.selectedCardClass) === undefined ? this.manager.getSelectedCardClass() : (_b = this.settings) === null || _b === void 0 ? void 0 : _b.selectedCardClass;
    };
    CardStock.prototype.removeSelectionClasses = function (card) {
        this.removeSelectionClassesFromElement(this.getCardElement(card));
    };
    CardStock.prototype.removeSelectionClassesFromElement = function (cardElement) {
        var selectableCardsClass = this.getSelectableCardClass();
        var unselectableCardsClass = this.getUnselectableCardClass();
        var selectedCardsClass = this.getSelectedCardClass();
        cardElement.classList.remove(selectableCardsClass, unselectableCardsClass, selectedCardsClass);
    };
    return CardStock;
}());
var SlideAndBackAnimation = /** @class */ (function (_super) {
    __extends(SlideAndBackAnimation, _super);
    function SlideAndBackAnimation(manager, element, tempElement) {
        var distance = (manager.getCardWidth() + manager.getCardHeight()) / 2;
        var angle = Math.random() * Math.PI * 2;
        var fromDelta = {
            x: distance * Math.cos(angle),
            y: distance * Math.sin(angle),
        };
        return _super.call(this, {
            animations: [
                new BgaSlideToAnimation({ element: element, fromDelta: fromDelta, duration: 250 }),
                new BgaSlideAnimation({ element: element, fromDelta: fromDelta, duration: 250, animationEnd: tempElement ? (function () { return element.remove(); }) : undefined }),
            ]
        }) || this;
    }
    return SlideAndBackAnimation;
}(BgaCumulatedAnimation));
/**
 * Abstract stock to represent a deck. (pile of cards, with a fake 3d effect of thickness). *
 * Needs cardWidth and cardHeight to be set in the card manager.
 */
var Deck = /** @class */ (function (_super) {
    __extends(Deck, _super);
    function Deck(manager, element, settings) {
        var _this = this;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        _this = _super.call(this, manager, element) || this;
        _this.manager = manager;
        _this.element = element;
        element.classList.add('deck');
        var cardWidth = _this.manager.getCardWidth();
        var cardHeight = _this.manager.getCardHeight();
        if (cardWidth && cardHeight) {
            _this.element.style.setProperty('--width', "".concat(cardWidth, "px"));
            _this.element.style.setProperty('--height', "".concat(cardHeight, "px"));
        }
        else {
            throw new Error("You need to set cardWidth and cardHeight in the card manager to use Deck.");
        }
        _this.thicknesses = (_a = settings.thicknesses) !== null && _a !== void 0 ? _a : [0, 2, 5, 10, 20, 30];
        _this.setCardNumber((_b = settings.cardNumber) !== null && _b !== void 0 ? _b : 52);
        _this.autoUpdateCardNumber = (_c = settings.autoUpdateCardNumber) !== null && _c !== void 0 ? _c : true;
        _this.autoRemovePreviousCards = (_d = settings.autoRemovePreviousCards) !== null && _d !== void 0 ? _d : true;
        var shadowDirection = (_e = settings.shadowDirection) !== null && _e !== void 0 ? _e : 'bottom-right';
        var shadowDirectionSplit = shadowDirection.split('-');
        var xShadowShift = shadowDirectionSplit.includes('right') ? 1 : (shadowDirectionSplit.includes('left') ? -1 : 0);
        var yShadowShift = shadowDirectionSplit.includes('bottom') ? 1 : (shadowDirectionSplit.includes('top') ? -1 : 0);
        _this.element.style.setProperty('--xShadowShift', '' + xShadowShift);
        _this.element.style.setProperty('--yShadowShift', '' + yShadowShift);
        if (settings.topCard) {
            _this.addCard(settings.topCard, undefined);
        }
        else if (settings.cardNumber > 0) {
            console.warn("Deck is defined with ".concat(settings.cardNumber, " cards but no top card !"));
        }
        if (settings.counter && ((_f = settings.counter.show) !== null && _f !== void 0 ? _f : true)) {
            if (settings.cardNumber === null || settings.cardNumber === undefined) {
                throw new Error("You need to set cardNumber if you want to show the counter");
            }
            else {
                _this.createCounter((_g = settings.counter.position) !== null && _g !== void 0 ? _g : 'bottom', (_h = settings.counter.extraClasses) !== null && _h !== void 0 ? _h : 'round', settings.counter.counterId);
                if ((_j = settings.counter) === null || _j === void 0 ? void 0 : _j.hideWhenEmpty) {
                    _this.element.querySelector('.bga-cards_deck-counter').classList.add('hide-when-empty');
                }
            }
        }
        _this.setCardNumber((_k = settings.cardNumber) !== null && _k !== void 0 ? _k : 52);
        return _this;
    }
    Deck.prototype.createCounter = function (counterPosition, extraClasses, counterId) {
        var left = counterPosition.includes('right') ? 100 : (counterPosition.includes('left') ? 0 : 50);
        var top = counterPosition.includes('bottom') ? 100 : (counterPosition.includes('top') ? 0 : 50);
        this.element.style.setProperty('--bga-cards-deck-left', "".concat(left, "%"));
        this.element.style.setProperty('--bga-cards-deck-top', "".concat(top, "%"));
        this.element.insertAdjacentHTML('beforeend', "\n            <div ".concat(counterId ? "id=\"".concat(counterId, "\"") : '', " class=\"bga-cards_deck-counter ").concat(extraClasses, "\"></div>\n        "));
    };
    /**
     * Get the the cards number.
     *
     * @returns the cards number
     */
    Deck.prototype.getCardNumber = function () {
        return this.cardNumber;
    };
    /**
     * Set the the cards number.
     *
     * @param cardNumber the cards number
     */
    Deck.prototype.setCardNumber = function (cardNumber, topCard) {
        var _this = this;
        if (topCard === void 0) { topCard = null; }
        if (topCard) {
            this.addCard(topCard);
        }
        this.cardNumber = cardNumber;
        this.element.dataset.empty = (this.cardNumber == 0).toString();
        var thickness = 0;
        this.thicknesses.forEach(function (threshold, index) {
            if (_this.cardNumber >= threshold) {
                thickness = index;
            }
        });
        this.element.style.setProperty('--thickness', "".concat(thickness, "px"));
        var counterDiv = this.element.querySelector('.bga-cards_deck-counter');
        if (counterDiv) {
            counterDiv.innerHTML = "".concat(cardNumber);
        }
    };
    Deck.prototype.addCard = function (card, animation, settings) {
        var _this = this;
        var _a, _b;
        if ((_a = settings === null || settings === void 0 ? void 0 : settings.autoUpdateCardNumber) !== null && _a !== void 0 ? _a : this.autoUpdateCardNumber) {
            this.setCardNumber(this.cardNumber + 1);
        }
        var promise = _super.prototype.addCard.call(this, card, animation, settings);
        if ((_b = settings === null || settings === void 0 ? void 0 : settings.autoRemovePreviousCards) !== null && _b !== void 0 ? _b : this.autoRemovePreviousCards) {
            promise.then(function () {
                var previousCards = _this.getCards().slice(0, -1); // remove last cards
                _this.removeCards(previousCards, { autoUpdateCardNumber: false });
            });
        }
        return promise;
    };
    Deck.prototype.cardRemoved = function (card, settings) {
        var _a;
        if ((_a = settings === null || settings === void 0 ? void 0 : settings.autoUpdateCardNumber) !== null && _a !== void 0 ? _a : this.autoUpdateCardNumber) {
            this.setCardNumber(this.cardNumber - 1);
        }
        _super.prototype.cardRemoved.call(this, card, settings);
    };
    Deck.prototype.getTopCard = function () {
        var cards = this.getCards();
        return cards.length ? cards[cards.length - 1] : null;
    };
    /**
     * Shows a shuffle animation on the deck
     *
     * @param animatedCardsMax number of animated cards for shuffle animation.
     * @param fakeCardSetter a function to generate a fake card for animation. Required if the card id is not based on a numerci `id` field, or if you want to set custom card back
     * @returns promise when animation ends
     */
    Deck.prototype.shuffle = function (animatedCardsMax, fakeCardSetter) {
        if (animatedCardsMax === void 0) { animatedCardsMax = 10; }
        return __awaiter(this, void 0, void 0, function () {
            var animatedCards, elements, i, newCard, newElement;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.manager.animationsActive()) {
                            return [2 /*return*/, Promise.resolve(false)]; // we don't execute as it's just visual temporary stuff
                        }
                        animatedCards = Math.min(10, animatedCardsMax, this.getCardNumber());
                        if (!(animatedCards > 1)) return [3 /*break*/, 2];
                        elements = [this.getCardElement(this.getTopCard())];
                        for (i = elements.length; i <= animatedCards; i++) {
                            newCard = {};
                            if (fakeCardSetter) {
                                fakeCardSetter(newCard, i);
                            }
                            else {
                                newCard.id = -100000 + i;
                            }
                            newElement = this.manager.createCardElement(newCard, false);
                            newElement.dataset.tempCardForShuffleAnimation = 'true';
                            this.element.prepend(newElement);
                            elements.push(newElement);
                        }
                        return [4 /*yield*/, this.manager.animationManager.playWithDelay(elements.map(function (element) { return new SlideAndBackAnimation(_this.manager, element, element.dataset.tempCardForShuffleAnimation == 'true'); }), 50)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 2: return [2 /*return*/, Promise.resolve(false)];
                }
            });
        });
    };
    return Deck;
}(CardStock));
/**
 * A basic stock for a list of cards, based on flex.
 */
var LineStock = /** @class */ (function (_super) {
    __extends(LineStock, _super);
    /**
     * @param manager the card manager
     * @param element the stock element (should be an empty HTML Element)
     * @param settings a `LineStockSettings` object
     */
    function LineStock(manager, element, settings) {
        var _this = this;
        var _a, _b, _c, _d;
        _this = _super.call(this, manager, element, settings) || this;
        _this.manager = manager;
        _this.element = element;
        element.classList.add('line-stock');
        element.dataset.center = ((_a = settings === null || settings === void 0 ? void 0 : settings.center) !== null && _a !== void 0 ? _a : true).toString();
        element.style.setProperty('--wrap', (_b = settings === null || settings === void 0 ? void 0 : settings.wrap) !== null && _b !== void 0 ? _b : 'wrap');
        element.style.setProperty('--direction', (_c = settings === null || settings === void 0 ? void 0 : settings.direction) !== null && _c !== void 0 ? _c : 'row');
        element.style.setProperty('--gap', (_d = settings === null || settings === void 0 ? void 0 : settings.gap) !== null && _d !== void 0 ? _d : '8px');
        return _this;
    }
    return LineStock;
}(CardStock));
/**
 * A stock with fixed slots (some can be empty)
 */
var SlotStock = /** @class */ (function (_super) {
    __extends(SlotStock, _super);
    /**
     * @param manager the card manager
     * @param element the stock element (should be an empty HTML Element)
     * @param settings a `SlotStockSettings` object
     */
    function SlotStock(manager, element, settings) {
        var _this = this;
        var _a, _b;
        _this = _super.call(this, manager, element, settings) || this;
        _this.manager = manager;
        _this.element = element;
        _this.slotsIds = [];
        _this.slots = [];
        element.classList.add('slot-stock');
        _this.mapCardToSlot = settings.mapCardToSlot;
        _this.slotsIds = (_a = settings.slotsIds) !== null && _a !== void 0 ? _a : [];
        _this.slotClasses = (_b = settings.slotClasses) !== null && _b !== void 0 ? _b : [];
        _this.slotsIds.forEach(function (slotId) {
            _this.createSlot(slotId);
        });
        return _this;
    }
    SlotStock.prototype.createSlot = function (slotId) {
        var _a;
        this.slots[slotId] = document.createElement("div");
        this.slots[slotId].dataset.slotId = slotId;
        this.element.appendChild(this.slots[slotId]);
        (_a = this.slots[slotId].classList).add.apply(_a, __spreadArray(['slot'], this.slotClasses, true));
    };
    /**
     * Add a card to the stock.
     *
     * @param card the card to add
     * @param animation a `CardAnimation` object
     * @param settings a `AddCardToSlotSettings` object
     * @returns the promise when the animation is done (true if it was animated, false if it wasn't)
     */
    SlotStock.prototype.addCard = function (card, animation, settings) {
        var _a, _b;
        var slotId = (_a = settings === null || settings === void 0 ? void 0 : settings.slot) !== null && _a !== void 0 ? _a : (_b = this.mapCardToSlot) === null || _b === void 0 ? void 0 : _b.call(this, card);
        if (slotId === undefined) {
            throw new Error("Impossible to add card to slot : no SlotId. Add slotId to settings or set mapCardToSlot to SlotCard constructor.");
        }
        if (!this.slots[slotId]) {
            throw new Error("Impossible to add card to slot \"".concat(slotId, "\" : slot \"").concat(slotId, "\" doesn't exists."));
        }
        var newSettings = __assign(__assign({}, settings), { forceToElement: this.slots[slotId] });
        return _super.prototype.addCard.call(this, card, animation, newSettings);
    };
    /**
     * Change the slots ids. Will empty the stock before re-creating the slots.
     *
     * @param slotsIds the new slotsIds. Will replace the old ones.
     */
    SlotStock.prototype.setSlotsIds = function (slotsIds) {
        var _this = this;
        if (slotsIds.length == this.slotsIds.length && slotsIds.every(function (slotId, index) { return _this.slotsIds[index] === slotId; })) {
            // no change
            return;
        }
        this.removeAll();
        this.element.innerHTML = '';
        this.slotsIds = slotsIds !== null && slotsIds !== void 0 ? slotsIds : [];
        this.slotsIds.forEach(function (slotId) {
            _this.createSlot(slotId);
        });
    };
    SlotStock.prototype.canAddCard = function (card, settings) {
        var _a, _b;
        if (!this.contains(card)) {
            return true;
        }
        else {
            var currentCardSlot = this.getCardElement(card).closest('.slot').dataset.slotId;
            var slotId = (_a = settings === null || settings === void 0 ? void 0 : settings.slot) !== null && _a !== void 0 ? _a : (_b = this.mapCardToSlot) === null || _b === void 0 ? void 0 : _b.call(this, card);
            return currentCardSlot != slotId;
        }
    };
    /**
     * Swap cards inside the slot stock.
     *
     * @param cards the cards to swap
     * @param settings for `updateInformations` and `selectable`
     */
    SlotStock.prototype.swapCards = function (cards, settings) {
        var _this = this;
        if (!this.mapCardToSlot) {
            throw new Error('You need to define SlotStock.mapCardToSlot to use SlotStock.swapCards');
        }
        var promises = [];
        var elements = cards.map(function (card) { return _this.manager.getCardElement(card); });
        var elementsRects = elements.map(function (element) { return element.getBoundingClientRect(); });
        var cssPositions = elements.map(function (element) { return element.style.position; });
        // we set to absolute so it doesn't mess with slide coordinates when 2 div are at the same place
        elements.forEach(function (element) { return element.style.position = 'absolute'; });
        cards.forEach(function (card, index) {
            var _a, _b;
            var cardElement = elements[index];
            var promise;
            var slotId = (_a = _this.mapCardToSlot) === null || _a === void 0 ? void 0 : _a.call(_this, card);
            _this.slots[slotId].appendChild(cardElement);
            cardElement.style.position = cssPositions[index];
            var cardIndex = _this.cards.findIndex(function (c) { return _this.manager.getId(c) == _this.manager.getId(card); });
            if (cardIndex !== -1) {
                _this.cards.splice(cardIndex, 1, card);
            }
            if ((_b = settings === null || settings === void 0 ? void 0 : settings.updateInformations) !== null && _b !== void 0 ? _b : true) { // after splice/push
                _this.manager.updateCardInformations(card);
            }
            _this.removeSelectionClassesFromElement(cardElement);
            promise = _this.animationFromElement(cardElement, elementsRects[index], {});
            if (!promise) {
                console.warn("CardStock.animationFromElement didn't return a Promise");
                promise = Promise.resolve(false);
            }
            promise.then(function () { var _a; return _this.setSelectableCard(card, (_a = settings === null || settings === void 0 ? void 0 : settings.selectable) !== null && _a !== void 0 ? _a : true); });
            promises.push(promise);
        });
        return Promise.all(promises);
    };
    return SlotStock;
}(LineStock));
/**
 * A stock to make cards disappear (to automatically remove discarded cards, or to represent a bag)
 */
var VoidStock = /** @class */ (function (_super) {
    __extends(VoidStock, _super);
    /**
     * @param manager the card manager
     * @param element the stock element (should be an empty HTML Element)
     */
    function VoidStock(manager, element) {
        var _this = _super.call(this, manager, element) || this;
        _this.manager = manager;
        _this.element = element;
        element.classList.add('void-stock');
        return _this;
    }
    /**
     * Add a card to the stock.
     *
     * @param card the card to add
     * @param animation a `CardAnimation` object
     * @param settings a `AddCardToVoidStockSettings` object
     * @returns the promise when the animation is done (true if it was animated, false if it wasn't)
     */
    VoidStock.prototype.addCard = function (card, animation, settings) {
        var _this = this;
        var _a;
        var promise = _super.prototype.addCard.call(this, card, animation, settings);
        // center the element
        var cardElement = this.getCardElement(card);
        var originalLeft = cardElement.style.left;
        var originalTop = cardElement.style.top;
        cardElement.style.left = "".concat((this.element.clientWidth - cardElement.clientWidth) / 2, "px");
        cardElement.style.top = "".concat((this.element.clientHeight - cardElement.clientHeight) / 2, "px");
        if (!promise) {
            console.warn("VoidStock.addCard didn't return a Promise");
            promise = Promise.resolve(false);
        }
        if ((_a = settings === null || settings === void 0 ? void 0 : settings.remove) !== null && _a !== void 0 ? _a : true) {
            return promise.then(function (result) {
                _this.removeCard(card);
                return result;
            });
        }
        else {
            cardElement.style.left = originalLeft;
            cardElement.style.top = originalTop;
            return promise;
        }
    };
    return VoidStock;
}(CardStock));
function sortFunction() {
    var sortedFields = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        sortedFields[_i] = arguments[_i];
    }
    return function (a, b) {
        for (var i = 0; i < sortedFields.length; i++) {
            var direction = 1;
            var field = sortedFields[i];
            if (field[0] == '-') {
                direction = -1;
                field = field.substring(1);
            }
            else if (field[0] == '+') {
                field = field.substring(1);
            }
            var type = typeof a[field];
            if (type === 'string') {
                var compare = a[field].localeCompare(b[field]);
                if (compare !== 0) {
                    return compare;
                }
            }
            else if (type === 'number') {
                var compare = (a[field] - b[field]) * direction;
                if (compare !== 0) {
                    return compare * direction;
                }
            }
        }
        return 0;
    };
}
var CardManager = /** @class */ (function () {
    /**
     * @param game the BGA game class, usually it will be `this`
     * @param settings: a `CardManagerSettings` object
     */
    function CardManager(game, settings) {
        var _a;
        this.game = game;
        this.settings = settings;
        this.stocks = [];
        this.updateFrontTimeoutId = [];
        this.updateBackTimeoutId = [];
        this.animationManager = (_a = settings.animationManager) !== null && _a !== void 0 ? _a : new AnimationManager(game);
    }
    /**
     * Returns if the animations are active. Animation aren't active when the window is not visible (`document.visibilityState === 'hidden'`), or `game.instantaneousMode` is true.
     *
     * @returns if the animations are active.
     */
    CardManager.prototype.animationsActive = function () {
        return this.animationManager.animationsActive();
    };
    CardManager.prototype.addStock = function (stock) {
        this.stocks.push(stock);
    };
    /**
     * @param card the card informations
     * @return the id for a card
     */
    CardManager.prototype.getId = function (card) {
        var _a, _b, _c;
        return (_c = (_b = (_a = this.settings).getId) === null || _b === void 0 ? void 0 : _b.call(_a, card)) !== null && _c !== void 0 ? _c : "card-".concat(card.id);
    };
    CardManager.prototype.createCardElement = function (card, visible) {
        var _a, _b, _c, _d, _e, _f;
        if (visible === void 0) { visible = true; }
        var id = this.getId(card);
        var side = visible ? 'front' : 'back';
        if (this.getCardElement(card)) {
            throw new Error('This card already exists ' + JSON.stringify(card));
        }
        var element = document.createElement("div");
        element.id = id;
        element.dataset.side = '' + side;
        element.innerHTML = "\n            <div class=\"card-sides\">\n                <div id=\"".concat(id, "-front\" class=\"card-side front\">\n                </div>\n                <div id=\"").concat(id, "-back\" class=\"card-side back\">\n                </div>\n            </div>\n        ");
        element.classList.add('card');
        document.body.appendChild(element);
        (_b = (_a = this.settings).setupDiv) === null || _b === void 0 ? void 0 : _b.call(_a, card, element);
        (_d = (_c = this.settings).setupFrontDiv) === null || _d === void 0 ? void 0 : _d.call(_c, card, element.getElementsByClassName('front')[0]);
        (_f = (_e = this.settings).setupBackDiv) === null || _f === void 0 ? void 0 : _f.call(_e, card, element.getElementsByClassName('back')[0]);
        document.body.removeChild(element);
        return element;
    };
    /**
     * @param card the card informations
     * @return the HTML element of an existing card
     */
    CardManager.prototype.getCardElement = function (card) {
        return document.getElementById(this.getId(card));
    };
    /**
     * Remove a card.
     *
     * @param card the card to remove
     * @param settings a `RemoveCardSettings` object
     */
    CardManager.prototype.removeCard = function (card, settings) {
        var _a;
        var id = this.getId(card);
        var div = document.getElementById(id);
        if (!div) {
            return false;
        }
        div.id = "deleted".concat(id);
        div.remove();
        // if the card is in a stock, notify the stock about removal
        (_a = this.getCardStock(card)) === null || _a === void 0 ? void 0 : _a.cardRemoved(card, settings);
        return true;
    };
    /**
     * Returns the stock containing the card.
     *
     * @param card the card informations
     * @return the stock containing the card
     */
    CardManager.prototype.getCardStock = function (card) {
        return this.stocks.find(function (stock) { return stock.contains(card); });
    };
    /**
     * Return if the card passed as parameter is suppose to be visible or not.
     * Use `isCardVisible` from settings if set, else will check if `card.type` is defined
     *
     * @param card the card informations
     * @return the visiblility of the card (true means front side should be displayed)
     */
    CardManager.prototype.isCardVisible = function (card) {
        var _a, _b, _c, _d;
        return (_c = (_b = (_a = this.settings).isCardVisible) === null || _b === void 0 ? void 0 : _b.call(_a, card)) !== null && _c !== void 0 ? _c : ((_d = card.type) !== null && _d !== void 0 ? _d : false);
    };
    /**
     * Set the card to its front (visible) or back (not visible) side.
     *
     * @param card the card informations
     * @param visible if the card is set to visible face. If unset, will use isCardVisible(card)
     * @param settings the flip params (to update the card in current stock)
     */
    CardManager.prototype.setCardVisible = function (card, visible, settings) {
        var _this = this;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        var element = this.getCardElement(card);
        if (!element) {
            return;
        }
        var isVisible = visible !== null && visible !== void 0 ? visible : this.isCardVisible(card);
        element.dataset.side = isVisible ? 'front' : 'back';
        var stringId = JSON.stringify(this.getId(card));
        if ((_a = settings === null || settings === void 0 ? void 0 : settings.updateFront) !== null && _a !== void 0 ? _a : true) {
            if (this.updateFrontTimeoutId[stringId]) { // make sure there is not a delayed animation that will overwrite the last flip request
                clearTimeout(this.updateFrontTimeoutId[stringId]);
                delete this.updateFrontTimeoutId[stringId];
            }
            var updateFrontDelay = (_b = settings === null || settings === void 0 ? void 0 : settings.updateFrontDelay) !== null && _b !== void 0 ? _b : 500;
            if (!isVisible && updateFrontDelay > 0 && this.animationsActive()) {
                this.updateFrontTimeoutId[stringId] = setTimeout(function () { var _a, _b; return (_b = (_a = _this.settings).setupFrontDiv) === null || _b === void 0 ? void 0 : _b.call(_a, card, element.getElementsByClassName('front')[0]); }, updateFrontDelay);
            }
            else {
                (_d = (_c = this.settings).setupFrontDiv) === null || _d === void 0 ? void 0 : _d.call(_c, card, element.getElementsByClassName('front')[0]);
            }
        }
        if ((_e = settings === null || settings === void 0 ? void 0 : settings.updateBack) !== null && _e !== void 0 ? _e : false) {
            if (this.updateBackTimeoutId[stringId]) { // make sure there is not a delayed animation that will overwrite the last flip request
                clearTimeout(this.updateBackTimeoutId[stringId]);
                delete this.updateBackTimeoutId[stringId];
            }
            var updateBackDelay = (_f = settings === null || settings === void 0 ? void 0 : settings.updateBackDelay) !== null && _f !== void 0 ? _f : 0;
            if (isVisible && updateBackDelay > 0 && this.animationsActive()) {
                this.updateBackTimeoutId[stringId] = setTimeout(function () { var _a, _b; return (_b = (_a = _this.settings).setupBackDiv) === null || _b === void 0 ? void 0 : _b.call(_a, card, element.getElementsByClassName('back')[0]); }, updateBackDelay);
            }
            else {
                (_h = (_g = this.settings).setupBackDiv) === null || _h === void 0 ? void 0 : _h.call(_g, card, element.getElementsByClassName('back')[0]);
            }
        }
        if ((_j = settings === null || settings === void 0 ? void 0 : settings.updateData) !== null && _j !== void 0 ? _j : true) {
            // card data has changed
            var stock = this.getCardStock(card);
            var cards = stock.getCards();
            var cardIndex = cards.findIndex(function (c) { return _this.getId(c) === _this.getId(card); });
            if (cardIndex !== -1) {
                stock.cards.splice(cardIndex, 1, card);
            }
        }
    };
    /**
     * Flips the card.
     *
     * @param card the card informations
     * @param settings the flip params (to update the card in current stock)
     */
    CardManager.prototype.flipCard = function (card, settings) {
        var element = this.getCardElement(card);
        var currentlyVisible = element.dataset.side === 'front';
        this.setCardVisible(card, !currentlyVisible, settings);
    };
    /**
     * Update the card informations. Used when a card with just an id (back shown) should be revealed, with all data needed to populate the front.
     *
     * @param card the card informations
     */
    CardManager.prototype.updateCardInformations = function (card, settings) {
        var newSettings = __assign(__assign({}, (settings !== null && settings !== void 0 ? settings : {})), { updateData: true });
        this.setCardVisible(card, undefined, newSettings);
    };
    /**
     * @returns the card with set in the settings (undefined if unset)
     */
    CardManager.prototype.getCardWidth = function () {
        var _a;
        return (_a = this.settings) === null || _a === void 0 ? void 0 : _a.cardWidth;
    };
    /**
     * @returns the card height set in the settings (undefined if unset)
     */
    CardManager.prototype.getCardHeight = function () {
        var _a;
        return (_a = this.settings) === null || _a === void 0 ? void 0 : _a.cardHeight;
    };
    /**
     * @returns the class to apply to selectable cards. Default 'bga-cards_selectable-card'.
     */
    CardManager.prototype.getSelectableCardClass = function () {
        var _a, _b;
        return ((_a = this.settings) === null || _a === void 0 ? void 0 : _a.selectableCardClass) === undefined ? 'bga-cards_selectable-card' : (_b = this.settings) === null || _b === void 0 ? void 0 : _b.selectableCardClass;
    };
    /**
     * @returns the class to apply to selectable cards. Default 'bga-cards_disabled-card'.
     */
    CardManager.prototype.getUnselectableCardClass = function () {
        var _a, _b;
        return ((_a = this.settings) === null || _a === void 0 ? void 0 : _a.unselectableCardClass) === undefined ? 'bga-cards_disabled-card' : (_b = this.settings) === null || _b === void 0 ? void 0 : _b.unselectableCardClass;
    };
    /**
     * @returns the class to apply to selected cards. Default 'bga-cards_selected-card'.
     */
    CardManager.prototype.getSelectedCardClass = function () {
        var _a, _b;
        return ((_a = this.settings) === null || _a === void 0 ? void 0 : _a.selectedCardClass) === undefined ? 'bga-cards_selected-card' : (_b = this.settings) === null || _b === void 0 ? void 0 : _b.selectedCardClass;
    };
    return CardManager;
}());
var CardsManager = /** @class */ (function (_super) {
    __extends(CardsManager, _super);
    function CardsManager(game) {
        var _this = _super.call(this, game, {
            getId: function (card) { return "card-".concat(card.id); },
            setupDiv: function (card, div) {
                div.classList.add('knarr-card');
                div.dataset.cardId = '' + card.id;
            },
            setupFrontDiv: function (card, div) {
                div.dataset.color = '' + card.color;
                div.dataset.gain = '' + card.gain;
                game.setTooltip(div.id, _this.getTooltip(card));
            },
            isCardVisible: function (card) { return Boolean(card.color); },
            cardWidth: 120,
            cardHeight: 221,
        }) || this;
        _this.game = game;
        return _this;
    }
    CardsManager.prototype.getTooltip = function (card) {
        var message = "\n        <strong>".concat(_("Color:"), "</strong> ").concat(this.game.getTooltipColor(card.color), "\n        <br>\n        <strong>").concat(_("Gain:"), "</strong> <strong>1</strong> ").concat(this.game.getTooltipGain(card.gain), "\n        ");
        return message;
    };
    return CardsManager;
}(CardManager));
var DestinationsManager = /** @class */ (function (_super) {
    __extends(DestinationsManager, _super);
    function DestinationsManager(game) {
        var _this = _super.call(this, game, {
            getId: function (card) { return "destination-".concat(card.id); },
            setupDiv: function (card, div) {
                div.classList.add('knarr-destination');
                div.dataset.cardId = '' + card.id;
                div.dataset.type = '' + card.type;
            },
            setupFrontDiv: function (card, div) {
                div.dataset.number = '' + card.number;
                if (card.number) {
                    game.setTooltip(div.id, _this.getTooltip(card));
                }
            },
            isCardVisible: function (card) { return Boolean(card.number); },
            cardWidth: 221,
            cardHeight: 120,
        }) || this;
        _this.game = game;
        return _this;
    }
    DestinationsManager.prototype.getCost = function (cost) {
        var _this = this;
        var keys = Object.keys(cost).map(function (c) { return Number(c); });
        if (keys.length == 1 && keys[0] == DIFFERENT) {
            return _("${number} different color cards").replace('${number}', "<strong>".concat(cost[keys[0]], "</strong>"));
        }
        else if (keys.length == 1 && keys[0] == EQUAL) {
            return _("${number} cards of the same color").replace('${number}', "<strong>".concat(cost[keys[0]], "</strong>"));
        }
        else {
            return keys.map(function (color) { return _("${number} ${color} cards").replace('${number}', "<strong>".concat(cost[color], "</strong>")).replace('${color}', _this.game.getTooltipColor(color)); }).join(', ');
        }
    };
    DestinationsManager.prototype.getGains = function (gains) {
        var _this = this;
        return Object.entries(gains).map(function (entry) { return "<strong>".concat(entry[1], "</strong> ").concat(_this.game.getTooltipGain(Number(entry[0]))); }).join(', ');
    };
    DestinationsManager.prototype.getType = function (type) {
        switch (type) {
            case 1: return _("Trading Lands");
            case 2: return _("Lands of Influence");
        }
    };
    DestinationsManager.prototype.getTooltip = function (destination) {
        var message = "\n        <strong>".concat(_("Exploration cost:"), "</strong> ").concat(this.getCost(destination.cost), " (recruits can be used as jokers)\n        <br>\n        <strong>").concat(_("Immediate gains:"), "</strong> ").concat(this.getGains(destination.immediateGains), "\n        <br>\n        <strong>").concat(_("Type:"), "</strong> ").concat(this.getType(destination.type), "\n        ");
        return message;
    };
    return DestinationsManager;
}(CardManager));
var ArtifactsManager = /** @class */ (function (_super) {
    __extends(ArtifactsManager, _super);
    function ArtifactsManager(game) {
        var _this = _super.call(this, game, {
            getId: function (card) { return "artifact-".concat(card); },
            setupDiv: function (card, div) {
                div.classList.add('artifact');
            },
            setupFrontDiv: function (card, div) { return _this.setupFrontDiv(card, div); },
            isCardVisible: function () { return true; },
        }) || this;
        _this.game = game;
        return _this;
    }
    ArtifactsManager.prototype.setupFrontDiv = function (card, div, ignoreTooltip) {
        if (ignoreTooltip === void 0) { ignoreTooltip = false; }
        div.dataset.number = '' + card;
        if (!ignoreTooltip) {
            this.game.setTooltip(div.id, this.getTooltip(card));
        }
    };
    ArtifactsManager.prototype.getArtifactName = function (number) {
        switch (number) {
            case 1: return _("Mead Cup");
            case 2: return _("Silver coin");
            case 3: return _("Cauldron");
            case 4: return _("Golden bracelet");
            case 5: return _("Helmet");
            case 6: return _("Amulet");
            case 7: return _("Weathervane");
        }
    };
    ArtifactsManager.prototype.getArtifactEffect = function (number) {
        switch (number) {
            case 1: return _("If a player takes an Explore action, they may discard a viking from the board and replace them with the first card from the deck.");
            case 2: return _("For each viking of the same color a player Recruits beyond their 3rd viking of that color, they gain 1 Victory Point.");
            case 3: return _("If a player Recruits a 2nd viking of the same color, they may take the Viking card of their choice instead of the one imposed by the card they played.");
            case 4: return _("If a player recruits a 3rd viking of the same color, they can reserve a Destination card of their choice. It is taken from the available cards and placed next to their playing area. When that player takes an Explore action, they may choose to Explore a destination they have reserved instead of an available destination. Each player can have up to 2 reserved Destination cards at a time.");
            case 5: return _("If a player places a Lands of Influence card which they have just Explored directly onto a Trading Lands card, they may immediately carry out a Recruit action.");
            case 6: return _("If a player completes a line of vikings with all 5 different colors, they can take 1 silver bracelet and 1 recruit, and gains 1 Reputation Point.");
            case 7: return _("If a player completes a line of vikings with all 5 different colors, they can immediately carry out an Explore action. They still have to pay the exploration cost.");
        }
    };
    ArtifactsManager.prototype.getTooltip = function (number) {
        return "\n            <div class=\"artifact-tooltip\">\n                <div class=\"title\">".concat(this.getArtifactName(number), "</div>\n                <div class=\"effect\">").concat(this.getArtifactEffect(number), "</div>\n            </div>\n        ");
    };
    ArtifactsManager.prototype.setForHelp = function (card, divId) {
        var div = document.getElementById(divId);
        div.classList.add('card', 'artifact');
        div.dataset.side = 'front';
        div.innerHTML = "\n        <div class=\"card-sides\">\n            <div class=\"card-side front\">\n            </div>\n            <div class=\"card-side back\">\n            </div>\n        </div>";
        this.setupFrontDiv(card, div.querySelector('.front'), true);
    };
    return ArtifactsManager;
}(CardManager));
var POINT_CASE_SIZE_LEFT = 38.8;
var POINT_CASE_SIZE_TOP = 37.6;
var TableCenter = /** @class */ (function () {
    function TableCenter(game, gamedatas) {
        var _this = this;
        this.game = game;
        this.destinationsDecks = [];
        this.destinations = [];
        this.vp = new Map();
        this.reputation = new Map();
        ['A', 'B'].forEach(function (letter) {
            _this.destinationsDecks[letter] = new Deck(game.destinationsManager, document.getElementById("table-destinations-".concat(letter, "-deck")), {
                cardNumber: gamedatas.centerDestinationsDeckCount[letter],
                topCard: gamedatas.centerDestinationsDeckTop[letter],
                counter: {
                    position: 'right',
                },
            });
            _this.destinations[letter] = new SlotStock(game.destinationsManager, document.getElementById("table-destinations-".concat(letter)), {
                slotsIds: [1, 2, 3],
                mapCardToSlot: function (card) { return card.locationArg; },
            });
            _this.destinations[letter].addCards(gamedatas.centerDestinations[letter]);
            _this.destinations[letter].onCardClick = function (card) { return _this.game.onTableDestinationClick(card); };
        });
        var cardDeckDiv = document.getElementById("card-deck");
        this.cardDeck = new Deck(game.cardsManager, cardDeckDiv, {
            cardNumber: gamedatas.cardDeckCount,
            topCard: gamedatas.cardDeckTop,
            counter: {
                counterId: 'deck-counter',
            },
        });
        cardDeckDiv.insertAdjacentHTML('beforeend', "\n            <div id=\"discard-counter\" class=\"bga-cards_deck-counter round\">".concat(gamedatas.cardDiscardCount, "</div>\n        "));
        var deckCounterDiv = document.getElementById('deck-counter');
        var discardCounterDiv = document.getElementById('discard-counter');
        this.game.setTooltip(deckCounterDiv.id, _('Deck size'));
        this.game.setTooltip(discardCounterDiv.id, _('Discard size'));
        this.cardDiscard = new VoidStock(game.cardsManager, discardCounterDiv);
        this.cards = new SlotStock(game.cardsManager, document.getElementById("table-cards"), {
            slotsIds: [1, 2, 3, 4, 5],
            mapCardToSlot: function (card) { return card.locationArg; },
            gap: '12px',
        });
        this.cards.onCardClick = function (card) { return _this.game.onTableCardClick(card); };
        this.cards.addCards(gamedatas.centerCards);
        var players = Object.values(gamedatas.players);
        var html = '';
        // points
        players.forEach(function (player) {
            return html += "\n            <div id=\"player-".concat(player.id, "-vp-marker\" class=\"marker ").concat(/*this.game.isColorBlindMode() ? 'color-blind' : */ '', "\" data-player-id=\"").concat(player.id, "\" data-player-no=\"").concat(player.playerNo, "\" data-color=\"").concat(player.color, "\"><div class=\"inner vp\"></div></div>\n            <div id=\"player-").concat(player.id, "-reputation-marker\" class=\"marker ").concat(/*this.game.isColorBlindMode() ? 'color-blind' : */ '', "\" data-player-id=\"").concat(player.id, "\" data-player-no=\"").concat(player.playerNo, "\" data-color=\"").concat(player.color, "\"><div class=\"inner reputation\"></div></div>\n            ");
        });
        dojo.place(html, 'board');
        players.forEach(function (player) {
            _this.vp.set(Number(player.id), Number(player.score));
            _this.reputation.set(Number(player.id), Math.min(14, Number(player.reputation)));
        });
        this.moveVP();
        this.moveReputation();
        if (gamedatas.variantOption >= 2) {
            document.getElementById('table-center').insertAdjacentHTML('afterbegin', "<div></div><div id=\"artifacts\"></div>");
            this.artifacts = new LineStock(this.game.artifactsManager, document.getElementById("artifacts"));
            this.artifacts.addCards(gamedatas.artifacts);
        }
    }
    TableCenter.prototype.newTableCard = function (card) {
        this.cards.addCard(card);
    };
    TableCenter.prototype.newTableDestination = function (destination, letter, destinationDeckCount, destinationDeckTop) {
        this.destinations[letter].addCard(destination);
        this.destinationsDecks[letter].setCardNumber(destinationDeckCount, destinationDeckTop);
    };
    TableCenter.prototype.setDestinationsSelectable = function (selectable, selectableCards) {
        var _this = this;
        if (selectableCards === void 0) { selectableCards = null; }
        ['A', 'B'].forEach(function (letter) {
            _this.destinations[letter].setSelectionMode(selectable ? 'single' : 'none');
            _this.destinations[letter].setSelectableCards(selectableCards);
        });
    };
    TableCenter.prototype.getVPCoordinates = function (points) {
        var cases = points % 40;
        var top = cases >= 16 ? (cases > 36 ? (40 - cases) : Math.min(4, cases - 16)) * POINT_CASE_SIZE_TOP : 0;
        var left = cases > 20 ? (36 - Math.min(cases, 36)) * POINT_CASE_SIZE_LEFT : Math.min(16, cases) * POINT_CASE_SIZE_LEFT;
        return [22 + left, 39 + top];
    };
    TableCenter.prototype.moveVP = function () {
        var _this = this;
        this.vp.forEach(function (points, playerId) {
            var markerDiv = document.getElementById("player-".concat(playerId, "-vp-marker"));
            var coordinates = _this.getVPCoordinates(points);
            var left = coordinates[0];
            var top = coordinates[1];
            var topShift = 0;
            var leftShift = 0;
            _this.vp.forEach(function (iPoints, iPlayerId) {
                if (iPoints % 40 === points % 40 && iPlayerId < playerId) {
                    topShift += 5;
                    //leftShift += 5;
                }
            });
            markerDiv.style.transform = "translateX(".concat(left + leftShift, "px) translateY(").concat(top + topShift, "px)");
        });
    };
    TableCenter.prototype.setScore = function (playerId, points) {
        this.vp.set(playerId, points);
        this.moveVP();
    };
    TableCenter.prototype.getReputationCoordinates = function (points) {
        var cases = points;
        var top = cases % 2 ? -14 : 0;
        var left = cases * 16.9;
        return [368 + left, 123 + top];
    };
    TableCenter.prototype.moveReputation = function () {
        var _this = this;
        this.reputation.forEach(function (points, playerId) {
            var markerDiv = document.getElementById("player-".concat(playerId, "-reputation-marker"));
            var coordinates = _this.getReputationCoordinates(points);
            var left = coordinates[0];
            var top = coordinates[1];
            var topShift = 0;
            var leftShift = 0;
            _this.reputation.forEach(function (iPoints, iPlayerId) {
                if (iPoints === points && iPlayerId < playerId) {
                    topShift += 5;
                    //leftShift += 5;
                }
            });
            markerDiv.style.transform = "translateX(".concat(left + leftShift, "px) translateY(").concat(top + topShift, "px)");
        });
    };
    TableCenter.prototype.setReputation = function (playerId, reputation) {
        this.reputation.set(playerId, Math.min(14, reputation));
        this.moveReputation();
    };
    TableCenter.prototype.getReputation = function (playerId) {
        return this.reputation.get(playerId);
    };
    TableCenter.prototype.setCardsSelectable = function (selectable, freeColor, recruits) {
        if (freeColor === void 0) { freeColor = null; }
        if (recruits === void 0) { recruits = null; }
        this.cards.setSelectionMode(selectable ? 'single' : 'none');
        if (selectable) {
            var selectableCards = this.cards.getCards().filter(function (card) { return freeColor === null || card.locationArg == freeColor || recruits >= 1; });
            this.cards.setSelectableCards(selectableCards);
        }
    };
    TableCenter.prototype.getVisibleDestinations = function () {
        return __spreadArray(__spreadArray([], this.destinations['A'].getCards(), true), this.destinations['B'].getCards(), true);
    };
    TableCenter.prototype.highlightPlayerTokens = function (playerId) {
        document.querySelectorAll('#board .marker').forEach(function (elem) { return elem.classList.toggle('highlight', Number(elem.dataset.playerId) === playerId); });
    };
    TableCenter.prototype.setDiscardCount = function (cardDiscardCount) {
        var discardCounterDiv = document.getElementById('discard-counter');
        discardCounterDiv.innerHTML = '' + cardDiscardCount;
    };
    return TableCenter;
}());
var isDebug = window.location.host == 'studio.boardgamearena.com' || window.location.hash.indexOf('debug') > -1;
;
var log = isDebug ? console.log.bind(window.console) : function () { };
var PlayerTable = /** @class */ (function () {
    function PlayerTable(game, player, reservePossible) {
        var _this = this;
        this.game = game;
        this.played = [];
        this.limitSelection = null;
        this.playerId = Number(player.id);
        this.currentPlayer = this.playerId == this.game.getPlayerId();
        var html = "\n        <div id=\"player-table-".concat(this.playerId, "\" class=\"player-table\" style=\"--player-color: #").concat(player.color, ";\">\n            <div id=\"player-table-").concat(this.playerId, "-name\" class=\"name-wrapper\">").concat(player.name, "</div>\n            <div class=\"cols\">\n            <div class=\"col col1\">\n        ");
        if (this.currentPlayer) {
            html += "\n            <div class=\"block-with-text hand-wrapper\">\n                <div class=\"block-label\">".concat(_('Your hand'), "</div>\n                <div id=\"player-table-").concat(this.playerId, "-hand\" class=\"hand cards\"></div>\n            </div>");
        }
        html += "\n            <div id=\"player-table-".concat(this.playerId, "-destinations\" class=\"destinations\"></div>\n            <div id=\"player-table-").concat(this.playerId, "-boat\" class=\"boat ").concat(this.game.getBoatSide() == 2 ? 'advanced' : 'normal', "\" data-color=\"").concat(player.color, "\" data-recruits=\"").concat(player.recruit, "\" data-bracelets=\"").concat(player.bracelet, "\">");
        for (var i = 1; i <= 3; i++) {
            if (this.currentPlayer) {
                html += "<div id=\"player-table-".concat(this.playerId, "-column").concat(i, "\" class=\"column\" data-number=\"").concat(i, "\"></div>");
            }
            html += "\n            <div class=\"icon bracelet\" data-number=\"".concat(i, "\"></div>\n            <div class=\"icon recruit\" data-number=\"").concat(i, "\"></div>\n            ");
        }
        html += "\n            </div>\n            <div class=\"visible-cards\">";
        for (var i = 1; i <= 5; i++) {
            html += "\n                <div id=\"player-table-".concat(this.playerId, "-played-").concat(i, "\" class=\"cards\"></div>\n                ");
        }
        html += "\n            </div>\n        ";
        if (reservePossible) {
            html += "\n            <div id=\"player-table-".concat(this.playerId, "-reserved-destinations-wrapper\" class=\"block-with-text hand-wrapper\">\n                <div class=\"block-label\">").concat(_('Reserved destinations'), "</div>\n                <div id=\"player-table-").concat(this.playerId, "-reserved-destinations\"></div>\n            </div>");
        }
        html += "\n            </div>\n            \n            <div class=\"col col2\"></div>\n            </div>\n        </div>\n        ";
        dojo.place(html, document.getElementById('tables'));
        if (this.currentPlayer) {
            var handDiv = document.getElementById("player-table-".concat(this.playerId, "-hand"));
            this.hand = new LineStock(this.game.cardsManager, handDiv, {
                sort: function (a, b) { return a.color == b.color ? a.gain - b.gain : a.color - b.color; },
            });
            this.hand.onCardClick = function (card) { return _this.game.onHandCardClick(card); };
            this.hand.addCards(player.hand);
        }
        this.voidStock = new VoidStock(this.game.cardsManager, document.getElementById("player-table-".concat(this.playerId, "-name")));
        for (var i = 1; i <= 5; i++) {
            var playedDiv = document.getElementById("player-table-".concat(this.playerId, "-played-").concat(i));
            this.played[i] = new LineStock(this.game.cardsManager, playedDiv, {
                direction: 'column',
                center: false,
            });
            this.played[i].onCardClick = function (card) {
                _this.game.onPlayedCardClick(card);
                if (_this.limitSelection !== null) {
                    _this.updateSelectable();
                }
            };
            this.played[i].addCards(player.playedCards[i]);
            playedDiv.style.setProperty('--card-overlap', '195px');
        }
        var destinationsDiv = document.getElementById("player-table-".concat(this.playerId, "-destinations"));
        this.destinations = new LineStock(this.game.destinationsManager, destinationsDiv, {
            center: false,
        });
        destinationsDiv.style.setProperty('--card-overlap', '94px');
        this.destinations.addCards(player.destinations);
        if (reservePossible) {
            this.reservedDestinations = new LineStock(this.game.destinationsManager, document.getElementById("player-table-".concat(this.playerId, "-reserved-destinations")), {
                center: false,
            });
            this.reservedDestinations.addCards(player.reservedDestinations);
            this.reservedDestinations.onCardClick = function (card) { return _this.game.onTableDestinationClick(card); };
        }
        [document.getElementById("player-table-".concat(this.playerId, "-name")), document.getElementById("player-table-".concat(this.playerId, "-boat"))].forEach(function (elem) {
            elem.addEventListener('mouseenter', function () { return _this.game.highlightPlayerTokens(_this.playerId); });
            elem.addEventListener('mouseleave', function () { return _this.game.highlightPlayerTokens(null); });
        });
    }
    PlayerTable.prototype.updateCounter = function (type, count) {
        document.getElementById("player-table-".concat(this.playerId, "-boat")).dataset[type] = '' + count;
    };
    PlayerTable.prototype.playCard = function (card, fromElement) {
        this.played[card.color].addCard(card, {
            fromElement: fromElement
        });
    };
    PlayerTable.prototype.setHandSelectable = function (selectable) {
        this.hand.setSelectionMode(selectable ? 'single' : 'none');
    };
    PlayerTable.prototype.setCardsSelectable = function (selectable, cost) {
        if (cost === void 0) { cost = null; }
        var colors = cost == null ? [] : Object.keys(cost).map(function (key) { return Number(key); });
        var equalOrDifferent = cost == null ? false : [EQUAL, DIFFERENT].includes(colors[0]);
        this.limitSelection = equalOrDifferent ? colors[0] : null;
        for (var i = 1; i <= 5; i++) {
            this.played[i].setSelectionMode(selectable ? 'multiple' : 'none');
            if (selectable) {
                var selectableCards = this.played[i].getCards().filter(function (card) {
                    var disabled = !selectable || cost == null;
                    if (!disabled) {
                        if (colors.length != 1 || (colors.length == 1 && !equalOrDifferent)) {
                            disabled = !colors.includes(card.color);
                        }
                    }
                    return !disabled;
                });
                this.played[i].setSelectableCards(selectableCards);
            }
        }
    };
    PlayerTable.prototype.getSelectedCards = function () {
        var cards = [];
        for (var i = 1; i <= 5; i++) {
            cards.push.apply(cards, this.played[i].getSelection());
        }
        return cards;
    };
    PlayerTable.prototype.reserveDestination = function (destination) {
        this.reservedDestinations.addCard(destination);
    };
    PlayerTable.prototype.setDestinationsSelectable = function (selectable, selectableCards) {
        if (selectableCards === void 0) { selectableCards = null; }
        if (!this.reservedDestinations) {
            return;
        }
        this.reservedDestinations.setSelectionMode(selectable ? 'single' : 'none');
        this.reservedDestinations.setSelectableCards(selectableCards);
    };
    PlayerTable.prototype.showColumns = function (number) {
        if (number > 0) {
            document.getElementById("player-table-".concat(this.playerId, "-boat")).style.setProperty('--column-height', "".concat(35 * (this.destinations.getCards().length + 1), "px"));
        }
        for (var i = 1; i <= 3; i++) {
            document.getElementById("player-table-".concat(this.playerId, "-column").concat(i)).classList.toggle('highlight', i <= number);
        }
    };
    PlayerTable.prototype.updateSelectable = function () {
        var _this = this;
        var selectedCards = this.getSelectedCards();
        var selectedColors = selectedCards.map(function (card) { return card.color; });
        var color = selectedCards.length ? selectedCards[0].color : null;
        for (var i = 1; i <= 5; i++) {
            var selectableCards = this.played[i].getCards().filter(function (card) {
                var disabled = false;
                if (_this.limitSelection === DIFFERENT) {
                    disabled = selectedColors.includes(card.color) && !selectedCards.includes(card);
                }
                else if (_this.limitSelection === EQUAL) {
                    disabled = color !== null && card.color != color;
                }
                return !disabled;
            });
            this.played[i].setSelectableCards(selectableCards);
        }
    };
    PlayerTable.prototype.setDoubleColumn = function (isDoublePlayerColumn) {
        var destinations = document.getElementById("player-table-".concat(this.playerId, "-destinations"));
        var boat = document.getElementById("player-table-".concat(this.playerId, "-boat"));
        var reservedDestinations = document.getElementById("player-table-".concat(this.playerId, "-reserved-destinations-wrapper"));
        if (isDoublePlayerColumn) {
            var col2 = document.getElementById("player-table-".concat(this.playerId)).querySelector('.col2');
            col2.appendChild(destinations);
            col2.appendChild(boat);
            if (reservedDestinations) {
                col2.appendChild(reservedDestinations);
            }
        }
        else {
            var visibleCards = document.getElementById("player-table-".concat(this.playerId)).querySelector('.visible-cards');
            visibleCards.insertAdjacentElement('beforebegin', destinations);
            visibleCards.insertAdjacentElement('beforebegin', boat);
            if (reservedDestinations) {
                visibleCards.insertAdjacentElement('afterend', reservedDestinations);
            }
        }
    };
    return PlayerTable;
}());
var ANIMATION_MS = 500;
var ACTION_TIMER_DURATION = 5;
var LOCAL_STORAGE_ZOOM_KEY = 'Knarr-zoom';
var LOCAL_STORAGE_JUMP_TO_FOLDED_KEY = 'Knarr-jump-to-folded';
var VP_BY_REPUTATION = {
    0: 0,
    3: 1,
    6: 2,
    10: 3,
    14: 5,
};
var EQUAL = -1;
var DIFFERENT = 0;
var VP = 1;
var BRACELET = 2;
var RECRUIT = 3;
var REPUTATION = 4;
var CARD = 5;
function getVpByReputation(reputation) {
    return Object.entries(VP_BY_REPUTATION).findLast(function (entry) { return reputation >= Number(entry[0]); })[1];
}
var Knarr = /** @class */ (function () {
    function Knarr() {
        this.playersTables = [];
        //private handCounters: Counter[] = [];
        this.reputationCounters = [];
        this.recruitCounters = [];
        this.braceletCounters = [];
        this.TOOLTIP_DELAY = document.body.classList.contains('touch-device') ? 1500 : undefined;
    }
    /*
        setup:

        This method must set up the game user interface according to current game situation specified
        in parameters.

        The method is called each time the game interface is displayed to a player, ie:
        _ when the game starts
        _ when a player refreshes the game page (F5)

        "gamedatas" argument contains all datas retrieved by your "getAllDatas" PHP method.
    */
    Knarr.prototype.setup = function (gamedatas) {
        var _this = this;
        if (!gamedatas.variantOption) {
            this.dontPreloadImage('artefacts.jpg');
        }
        if (gamedatas.boatSideOption == 2) {
            this.dontPreloadImage('boats-normal.png');
        }
        else {
            this.dontPreloadImage('boats-advanced.png');
        }
        log("Starting game setup");
        this.gamedatas = gamedatas;
        log('gamedatas', gamedatas);
        this.cardsManager = new CardsManager(this);
        this.destinationsManager = new DestinationsManager(this);
        this.artifactsManager = new ArtifactsManager(this);
        this.animationManager = new AnimationManager(this);
        new JumpToManager(this, {
            localStorageFoldedKey: LOCAL_STORAGE_JUMP_TO_FOLDED_KEY,
            topEntries: [
                new JumpToEntry(_('Main board'), 'table-center', { 'color': '#224757' })
            ],
            entryClasses: 'triangle-point',
            defaultFolded: true,
        });
        this.tableCenter = new TableCenter(this, gamedatas);
        this.createPlayerPanels(gamedatas);
        this.createPlayerTables(gamedatas);
        this.zoomManager = new ZoomManager({
            element: document.getElementById('table'),
            smooth: false,
            zoomControls: {
                color: 'black',
            },
            localStorageZoomKey: LOCAL_STORAGE_ZOOM_KEY,
            onDimensionsChange: function () {
                var tablesAndCenter = document.getElementById('tables-and-center');
                var clientWidth = tablesAndCenter.clientWidth;
                tablesAndCenter.classList.toggle('double-column', clientWidth > 1478);
                var wasDoublePlayerColumn = tablesAndCenter.classList.contains('double-player-column');
                var isDoublePlayerColumn = clientWidth > 1798;
                if (wasDoublePlayerColumn != isDoublePlayerColumn) {
                    tablesAndCenter.classList.toggle('double-player-column', isDoublePlayerColumn);
                    _this.playersTables.forEach(function (table) { return table.setDoubleColumn(isDoublePlayerColumn); });
                }
            },
        });
        if (gamedatas.lastTurn) {
            this.notif_lastTurn(false);
        }
        this.addHelp();
        this.setupNotifications();
        this.setupPreferences();
        log("Ending game setup");
    };
    ///////////////////////////////////////////////////
    //// Game & client states
    // onEnteringState: this method is called each time we are entering into a new game state.
    //                  You can use this method to perform some user interface changes at this moment.
    //
    Knarr.prototype.onEnteringState = function (stateName, args) {
        log('Entering state: ' + stateName, args.args);
        switch (stateName) {
            case 'playAction':
                this.onEnteringPlayAction(args.args);
                break;
            case 'chooseNewCard':
                this.onEnteringChooseNewCard(args.args);
                break;
            case 'payDestination':
                this.onEnteringPayDestination(args.args);
                break;
            case 'discardTableCard':
                this.onEnteringDiscardTableCard();
                break;
            case 'reserveDestination':
                this.onEnteringReserveDestination();
                break;
        }
    };
    Knarr.prototype.setGamestateDescription = function (property) {
        if (property === void 0) { property = ''; }
        var originalState = this.gamedatas.gamestates[this.gamedatas.gamestate.id];
        this.gamedatas.gamestate.description = "".concat(originalState['description' + property]);
        this.gamedatas.gamestate.descriptionmyturn = "".concat(originalState['descriptionmyturn' + property]);
        this.updatePageTitle();
    };
    Knarr.prototype.onEnteringPlayAction = function (args) {
        var _a, _b;
        if (!args.canExplore && !args.canRecruit) {
            this.setGamestateDescription('TradeOnly');
        }
        else if (!args.canExplore) {
            this.setGamestateDescription('RecruitOnly');
        }
        else if (!args.canRecruit) {
            this.setGamestateDescription('ExploreOnly');
        }
        if (this.isCurrentPlayerActive()) {
            if (args.canExplore) {
                this.tableCenter.setDestinationsSelectable(true, args.possibleDestinations);
                (_a = this.getCurrentPlayerTable()) === null || _a === void 0 ? void 0 : _a.setDestinationsSelectable(true, args.possibleDestinations);
            }
            if (args.canRecruit) {
                (_b = this.getCurrentPlayerTable()) === null || _b === void 0 ? void 0 : _b.setHandSelectable(true);
            }
        }
    };
    Knarr.prototype.onEnteringChooseNewCard = function (args) {
        if (this.isCurrentPlayerActive()) {
            this.tableCenter.setCardsSelectable(true, args.allFree ? null : args.freeColor, args.recruits);
        }
    };
    Knarr.prototype.onEnteringDiscardTableCard = function () {
        if (this.isCurrentPlayerActive()) {
            this.tableCenter.setCardsSelectable(true, null, 0);
        }
    };
    Knarr.prototype.onEnteringDiscardCard = function (args) {
        var _a;
        if (this.isCurrentPlayerActive()) {
            (_a = this.getCurrentPlayerTable()) === null || _a === void 0 ? void 0 : _a.setCardsSelectable(true, [0]);
        }
    };
    Knarr.prototype.onEnteringPayDestination = function (args) {
        var _a;
        var selectedCardDiv = this.destinationsManager.getCardElement(args.selectedDestination);
        selectedCardDiv.classList.add('selected-pay-destination');
        if (this.isCurrentPlayerActive()) {
            (_a = this.getCurrentPlayerTable()) === null || _a === void 0 ? void 0 : _a.setCardsSelectable(true, args.selectedDestination.cost);
        }
    };
    Knarr.prototype.onEnteringReserveDestination = function () {
        if (this.isCurrentPlayerActive()) {
            this.tableCenter.setDestinationsSelectable(true, this.tableCenter.getVisibleDestinations());
        }
    };
    Knarr.prototype.onLeavingState = function (stateName) {
        log('Leaving state: ' + stateName);
        switch (stateName) {
            case 'playAction':
                this.onLeavingPlayAction();
                break;
            case 'chooseNewCard':
                this.onLeavingChooseNewCard();
                break;
            case 'payDestination':
                this.onLeavingPayDestination();
                break;
            case 'discardTableCard':
                this.onLeavingDiscardTableCard();
                break;
            case 'discardCard':
                this.onLeavingDiscardCard();
                break;
            case 'reserveDestination':
                this.onLeavingReserveDestination();
                break;
        }
    };
    Knarr.prototype.onLeavingPlayAction = function () {
        var _a, _b;
        this.tableCenter.setDestinationsSelectable(false);
        (_a = this.getCurrentPlayerTable()) === null || _a === void 0 ? void 0 : _a.setHandSelectable(false);
        (_b = this.getCurrentPlayerTable()) === null || _b === void 0 ? void 0 : _b.setDestinationsSelectable(false);
    };
    Knarr.prototype.onLeavingChooseNewCard = function () {
        this.tableCenter.setCardsSelectable(false);
    };
    Knarr.prototype.onLeavingPayDestination = function () {
        var _a;
        document.querySelectorAll('.selected-pay-destination').forEach(function (elem) { return elem.classList.remove('selected-pay-destination'); });
        (_a = this.getCurrentPlayerTable()) === null || _a === void 0 ? void 0 : _a.setCardsSelectable(false);
    };
    Knarr.prototype.onLeavingDiscardTableCard = function () {
        this.tableCenter.setCardsSelectable(false);
    };
    Knarr.prototype.onLeavingDiscardCard = function () {
        var _a;
        (_a = this.getCurrentPlayerTable()) === null || _a === void 0 ? void 0 : _a.setCardsSelectable(false);
    };
    Knarr.prototype.onLeavingReserveDestination = function () {
        this.tableCenter.setDestinationsSelectable(false);
    };
    Knarr.prototype.setPayDestinationLabelAndState = function (args) {
        if (!args) {
            args = this.gamedatas.gamestate.args;
        }
        var selectedCards = this.getCurrentPlayerTable().getSelectedCards();
        var button = document.getElementById("payDestination_button");
        var total = Object.values(args.selectedDestination.cost).reduce(function (a, b) { return a + b; }, 0);
        var cards = selectedCards.length;
        var recruits = total - cards;
        var message = '';
        if (recruits > 0 && cards > 0) {
            message = _("Pay the ${cards} selected card(s) and ${recruits} recruit(s)");
        }
        else if (cards > 0) {
            message = _("Pay the ${cards} selected card(s)");
        }
        else if (recruits > 0) {
            message = _("Pay ${recruits} recruit(s)");
        }
        button.innerHTML = message.replace('${recruits}', '' + recruits).replace('${cards}', '' + cards);
        button.classList.toggle('disabled', args.recruits < recruits);
        button.dataset.recruits = '' + recruits;
    };
    // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
    //                        action status bar (ie: the HTML links in the status bar).
    //
    Knarr.prototype.onUpdateActionButtons = function (stateName, args) {
        var _this = this;
        if (this.isCurrentPlayerActive()) {
            switch (stateName) {
                case 'playAction':
                    var playActionArgs = args;
                    this.addActionButton("goTrade_button", _("Trade"), function () { return _this.goTrade(); });
                    if (!playActionArgs.canTrade) {
                        document.getElementById("goTrade_button").classList.add('disabled');
                    }
                    if (!playActionArgs.canExplore || !playActionArgs.canRecruit) {
                        this.addActionButton("endTurn_button", _("End turn"), function () { return _this.endTurn(); });
                    }
                    break;
                case 'chooseNewCard':
                    var chooseNewCardArgs_1 = args;
                    [1, 2, 3, 4, 5].forEach(function (color) {
                        var free = chooseNewCardArgs_1.allFree || color == chooseNewCardArgs_1.freeColor;
                        _this.addActionButton("chooseNewCard".concat(color, "_button"), _("Take ${color}").replace('${color}', "<div class=\"color\" data-color=\"".concat(color, "\"></div>")) + " (".concat(free ? _('free') : "1 <div class=\"recruit icon\"></div>", ")"), function () { return _this.chooseNewCard(chooseNewCardArgs_1.centerCards.find(function (card) { return card.locationArg == color; }).id); }, null, null, free ? undefined : 'gray');
                        if (!free && chooseNewCardArgs_1.recruits < 1) {
                            document.getElementById("chooseNewCard".concat(color, "_button")).classList.add('disabled');
                        }
                    });
                    break;
                case 'payDestination':
                    this.addActionButton("payDestination_button", '', function () { return _this.payDestination(); });
                    this.setPayDestinationLabelAndState(args);
                    this.addActionButton("cancel_button", _("Cancel"), function () { return _this.cancel(); }, null, null, 'gray');
                    break;
                case 'trade':
                    var tradeArgs_1 = args;
                    [1, 2, 3].forEach(function (number) {
                        _this.addActionButton("trade".concat(number, "_button"), _("Trade ${number} bracelet(s)").replace('${number}', number), function () { return _this.trade(number, tradeArgs_1.gainsByBracelets[number] == 0); });
                        var button = document.getElementById("trade".concat(number, "_button"));
                        if (tradeArgs_1.bracelets < number) {
                            button.classList.add('disabled');
                        }
                        else {
                            button.addEventListener('mouseenter', function () { return _this.getCurrentPlayerTable().showColumns(number); });
                            button.addEventListener('mouseleave', function () { return _this.getCurrentPlayerTable().showColumns(0); });
                        }
                    });
                    this.addActionButton("cancel_button", _("Cancel"), function () { return _this.cancel(); }, null, null, 'gray');
                    break;
                // multiplayer state    
                case 'discardCard':
                    this.onEnteringDiscardCard(args);
                    break;
            }
        }
    };
    ///////////////////////////////////////////////////
    //// Utility methods
    ///////////////////////////////////////////////////
    Knarr.prototype.setTooltip = function (id, html) {
        this.addTooltipHtml(id, html, this.TOOLTIP_DELAY);
    };
    Knarr.prototype.setTooltipToClass = function (className, html) {
        this.addTooltipHtmlToClass(className, html, this.TOOLTIP_DELAY);
    };
    Knarr.prototype.getPlayerId = function () {
        return Number(this.player_id);
    };
    Knarr.prototype.getPlayer = function (playerId) {
        return Object.values(this.gamedatas.players).find(function (player) { return Number(player.id) == playerId; });
    };
    Knarr.prototype.getPlayerTable = function (playerId) {
        return this.playersTables.find(function (playerTable) { return playerTable.playerId === playerId; });
    };
    Knarr.prototype.getCurrentPlayerTable = function () {
        var _this = this;
        return this.playersTables.find(function (playerTable) { return playerTable.playerId === _this.getPlayerId(); });
    };
    Knarr.prototype.getBoatSide = function () {
        return this.gamedatas.boatSideOption;
    };
    Knarr.prototype.getVariantOption = function () {
        return this.gamedatas.variantOption;
    };
    Knarr.prototype.getGameStateName = function () {
        return this.gamedatas.gamestate.name;
    };
    Knarr.prototype.setupPreferences = function () {
        var _this = this;
        // Extract the ID and value from the UI control
        var onchange = function (e) {
            var match = e.target.id.match(/^preference_[cf]ontrol_(\d+)$/);
            if (!match) {
                return;
            }
            var prefId = +match[1];
            var prefValue = +e.target.value;
            _this.prefs[prefId].value = prefValue;
        };
        // Call onPreferenceChange() when any value changes
        dojo.query(".preference_control").connect("onchange", onchange);
        // Call onPreferenceChange() now
        dojo.forEach(dojo.query("#ingame_menu_content .preference_control"), function (el) { return onchange({ target: el }); });
    };
    Knarr.prototype.getOrderedPlayers = function (gamedatas) {
        var _this = this;
        var players = Object.values(gamedatas.players).sort(function (a, b) { return a.playerNo - b.playerNo; });
        var playerIndex = players.findIndex(function (player) { return Number(player.id) === Number(_this.player_id); });
        var orderedPlayers = playerIndex > 0 ? __spreadArray(__spreadArray([], players.slice(playerIndex), true), players.slice(0, playerIndex), true) : players;
        return orderedPlayers;
    };
    Knarr.prototype.createPlayerPanels = function (gamedatas) {
        var _this = this;
        Object.values(gamedatas.players).forEach(function (player) {
            var playerId = Number(player.id);
            document.getElementById("player_score_".concat(player.id)).insertAdjacentHTML('beforebegin', "<div class=\"vp icon\"></div>");
            document.getElementById("icon_point_".concat(player.id)).remove();
            /*
                <div id="playerhand-counter-wrapper-${player.id}" class="playerhand-counter">
                    <div class="player-hand-card"></div>
                    <span id="playerhand-counter-${player.id}"></span>
                </div>*/
            var html = "<div class=\"counters\">\n            \n                <div id=\"reputation-counter-wrapper-".concat(player.id, "\" class=\"reputation-counter\">\n                    <div class=\"reputation icon\"></div>\n                    <span id=\"reputation-counter-").concat(player.id, "\"></span> <span class=\"reputation-legend\"><div class=\"vp icon\"></div> / ").concat(_('round'), "</span>\n                </div>\n\n            </div><div class=\"counters\">\n            \n                <div id=\"recruit-counter-wrapper-").concat(player.id, "\" class=\"recruit-counter\">\n                    <div class=\"recruit icon\"></div>\n                    <span id=\"recruit-counter-").concat(player.id, "\"></span>\n                </div>\n            \n                <div id=\"bracelet-counter-wrapper-").concat(player.id, "\" class=\"bracelet-counter\">\n                    <div class=\"bracelet icon\"></div>\n                    <span id=\"bracelet-counter-").concat(player.id, "\"></span>\n                </div>\n                \n            </div>\n            <div>").concat(playerId == gamedatas.firstPlayerId ? "<div id=\"first-player\">".concat(_('First player'), "</div>") : '', "</div>");
            dojo.place(html, "player_board_".concat(player.id));
            /*const handCounter = new ebg.counter();
            handCounter.create(`playerhand-counter-${playerId}`);
            handCounter.setValue(player.handCount);
            this.handCounters[playerId] = handCounter;*/
            _this.reputationCounters[playerId] = new ebg.counter();
            _this.reputationCounters[playerId].create("reputation-counter-".concat(playerId));
            _this.reputationCounters[playerId].setValue(getVpByReputation(player.reputation));
            _this.recruitCounters[playerId] = new ebg.counter();
            _this.recruitCounters[playerId].create("recruit-counter-".concat(playerId));
            _this.recruitCounters[playerId].setValue(player.recruit);
            _this.braceletCounters[playerId] = new ebg.counter();
            _this.braceletCounters[playerId].create("bracelet-counter-".concat(playerId));
            _this.braceletCounters[playerId].setValue(player.bracelet);
        });
        this.setTooltipToClass('reputation-counter', _('Reputation'));
        this.setTooltipToClass('recruit-counter', _('Recruits'));
        this.setTooltipToClass('bracelet-counter', _('Bracelets'));
    };
    Knarr.prototype.createPlayerTables = function (gamedatas) {
        var _this = this;
        var orderedPlayers = this.getOrderedPlayers(gamedatas);
        orderedPlayers.forEach(function (player) {
            return _this.createPlayerTable(gamedatas, Number(player.id));
        });
    };
    Knarr.prototype.createPlayerTable = function (gamedatas, playerId) {
        var table = new PlayerTable(this, gamedatas.players[playerId], gamedatas.reservePossible);
        this.playersTables.push(table);
    };
    Knarr.prototype.updateGains = function (playerId, gains) {
        var _this = this;
        Object.entries(gains).forEach(function (entry) {
            var type = Number(entry[0]);
            var amount = entry[1];
            if (amount != 0) {
                switch (type) {
                    case VP:
                        _this.setScore(playerId, _this.scoreCtrl[playerId].getValue() + amount);
                        break;
                    case BRACELET:
                        _this.setBracelets(playerId, _this.braceletCounters[playerId].getValue() + amount);
                        break;
                    case RECRUIT:
                        _this.setRecruits(playerId, _this.recruitCounters[playerId].getValue() + amount);
                        break;
                    case REPUTATION:
                        _this.setReputation(playerId, _this.tableCenter.getReputation(playerId) + amount);
                        break;
                }
            }
        });
    };
    Knarr.prototype.setScore = function (playerId, score) {
        var _a;
        (_a = this.scoreCtrl[playerId]) === null || _a === void 0 ? void 0 : _a.toValue(score);
        this.tableCenter.setScore(playerId, score);
    };
    Knarr.prototype.setReputation = function (playerId, count) {
        this.reputationCounters[playerId].toValue(getVpByReputation(count));
        this.tableCenter.setReputation(playerId, count);
    };
    Knarr.prototype.setRecruits = function (playerId, count) {
        this.recruitCounters[playerId].toValue(count);
        this.getPlayerTable(playerId).updateCounter('recruits', count);
    };
    Knarr.prototype.setBracelets = function (playerId, count) {
        this.braceletCounters[playerId].toValue(count);
        this.getPlayerTable(playerId).updateCounter('bracelets', count);
    };
    Knarr.prototype.highlightPlayerTokens = function (playerId) {
        this.tableCenter.highlightPlayerTokens(playerId);
    };
    Knarr.prototype.addHelp = function () {
        var _this = this;
        var labels = [1, 2, 3, 4, 5].map(function (number) { return "<div class=\"color\" data-color=\"".concat(number, "\"></div><span class=\"label\"> ").concat(_this.getColor(number), "</span>"); }).join('');
        dojo.place("\n            <button id=\"knarr-help-button\">?</button>\n            <button id=\"color-help-button\" data-folded=\"true\">".concat(labels, "</button>\n        "), 'left-side');
        document.getElementById('knarr-help-button').addEventListener('click', function () { return _this.showHelp(); });
        var helpButton = document.getElementById('color-help-button');
        helpButton.addEventListener('click', function () { return helpButton.dataset.folded = helpButton.dataset.folded == 'true' ? 'false' : 'true'; });
    };
    Knarr.prototype.showHelp = function () {
        var helpDialog = new ebg.popindialog();
        helpDialog.create('knarrHelpDialog');
        helpDialog.setTitle(_("Card help").toUpperCase());
        var html = "\n        <div id=\"help-popin\">\n            <h1>".concat(_("Assets"), "</h2>\n            <div class=\"help-section\">\n                <div class=\"icon vp\"></div>\n                <div class=\"help-label\">").concat(_("Gain 1 <strong>Victory Point</strong>. The player moves their token forward 1 space on the Score Track."), "</div>\n            </div>\n            <div class=\"help-section\">\n                <div class=\"icon recruit\"></div>\n                <div class=\"help-label\">").concat(_("Gain 1 <strong>Recruit</strong>: The player adds 1 Recruit token to their ship."), " ").concat(_("It is not possible to have more than 3."), " ").concat(_("A recruit allows a player to draw the Viking card of their choice when Recruiting or replaces a Viking card during Exploration."), "</div>\n            </div>\n            <div class=\"help-section\">\n                <div class=\"icon bracelet\"></div>\n                <div class=\"help-label\">").concat(_("Gain 1 <strong>Silver Bracelet</strong>: The player adds 1 Silver Bracelet token to their ship."), " ").concat(_("It is not possible to have more than 3."), " ").concat(_("They are used for Trading."), "</div>\n            </div>\n            <div class=\"help-section\">\n                <div class=\"icon reputation\"></div>\n                <div class=\"help-label\">").concat(_("Gain 1 <strong>Reputation Point</strong>: The player moves their token forward 1 space on the Reputation Track."), "</div>\n            </div>\n            <div class=\"help-section\">\n                <div class=\"icon take-card\"></div>\n                <div class=\"help-label\">").concat(_("Draw <strong>the first Viking card</strong> from the deck: It is placed in the player’s Crew Zone (without taking any assets)."), "</div>\n            </div>\n\n            <h1>").concat(_("Powers of the artifacts (variant option)"), "</h1>\n        ");
        for (var i = 1; i <= 7; i++) {
            html += "\n            <div class=\"help-section\">\n                <div id=\"help-artifact-".concat(i, "\"></div>\n                <div>").concat(this.artifactsManager.getTooltip(i), "</div>\n            </div> ");
        }
        html += "</div>";
        // Show the dialog
        helpDialog.setContent(html);
        helpDialog.show();
        for (var i = 1; i <= 7; i++) {
            this.artifactsManager.setForHelp(i, "help-artifact-".concat(i));
        }
    };
    Knarr.prototype.onTableDestinationClick = function (destination) {
        if (this.gamedatas.gamestate.name == 'reserveDestination') {
            this.reserveDestination(destination.id);
        }
        else {
            this.takeDestination(destination.id);
        }
    };
    Knarr.prototype.onHandCardClick = function (card) {
        this.playCard(card.id);
    };
    Knarr.prototype.onTableCardClick = function (card) {
        if (this.gamedatas.gamestate.name == 'discardTableCard') {
            this.discardTableCard(card.id);
        }
        else {
            this.chooseNewCard(card.id);
        }
    };
    Knarr.prototype.onPlayedCardClick = function (card) {
        if (this.gamedatas.gamestate.name == 'discardCard') {
            this.discardCard(card.id);
        }
        else {
            this.setPayDestinationLabelAndState();
        }
    };
    Knarr.prototype.goTrade = function () {
        if (!this.checkAction('goTrade')) {
            return;
        }
        this.takeAction('goTrade');
    };
    Knarr.prototype.playCard = function (id) {
        if (!this.checkAction('playCard')) {
            return;
        }
        this.takeAction('playCard', {
            id: id
        });
    };
    Knarr.prototype.takeDestination = function (id) {
        if (!this.checkAction('takeDestination')) {
            return;
        }
        this.takeAction('takeDestination', {
            id: id
        });
    };
    Knarr.prototype.reserveDestination = function (id) {
        if (!this.checkAction('reserveDestination')) {
            return;
        }
        this.takeAction('reserveDestination', {
            id: id
        });
    };
    Knarr.prototype.chooseNewCard = function (id) {
        if (!this.checkAction('chooseNewCard')) {
            return;
        }
        this.takeAction('chooseNewCard', {
            id: id
        });
    };
    Knarr.prototype.payDestination = function () {
        if (!this.checkAction('payDestination')) {
            return;
        }
        var ids = this.getCurrentPlayerTable().getSelectedCards().map(function (card) { return card.id; });
        var recruits = Number(document.getElementById("payDestination_button").dataset.recruits);
        this.takeAction('payDestination', {
            ids: ids.join(','),
            recruits: recruits
        });
    };
    Knarr.prototype.trade = function (number, showWarning) {
        var _this = this;
        if (!this.checkAction('trade')) {
            return;
        }
        if (showWarning) {
            this.confirmationDialog(_("Are you sure you want to trade ${bracelets} bracelet(s) ? There is nothing to gain yet with this number of bracelet(s)").replace('${bracelets}', number), function () { return _this.trade(number, false); });
            return;
        }
        this.takeAction('trade', {
            number: number
        });
    };
    Knarr.prototype.cancel = function () {
        if (!this.checkAction('cancel')) {
            return;
        }
        this.takeAction('cancel');
    };
    Knarr.prototype.endTurn = function () {
        if (!this.checkAction('endTurn')) {
            return;
        }
        this.takeAction('endTurn');
    };
    Knarr.prototype.discardTableCard = function (id) {
        if (!this.checkAction('discardTableCard')) {
            return;
        }
        this.takeAction('discardTableCard', {
            id: id
        });
    };
    Knarr.prototype.discardCard = function (id) {
        if (!this.checkAction('discardCard')) {
            return;
        }
        this.takeAction('discardCard', {
            id: id
        });
    };
    Knarr.prototype.takeAction = function (action, data) {
        data = data || {};
        data.lock = true;
        this.ajaxcall("/knarr/knarr/".concat(action, ".html"), data, this, function () { });
    };
    ///////////////////////////////////////////////////
    //// Reaction to cometD notifications
    /*
        setupNotifications:

        In this method, you associate each of your game notifications with your local method to handle it.

        Note: game notification names correspond to "notifyAllPlayers" and "notifyPlayer" calls in
                your pylos.game.php file.

    */
    Knarr.prototype.setupNotifications = function () {
        //log( 'notifications subscriptions setup' );
        var _this = this;
        var notifs = [
            ['playCard', ANIMATION_MS],
            ['takeCard', ANIMATION_MS],
            ['newTableCard', ANIMATION_MS],
            ['takeDestination', ANIMATION_MS],
            ['discardCards', ANIMATION_MS * 1.5],
            ['newTableDestination', ANIMATION_MS],
            ['trade', ANIMATION_MS],
            ['takeDeckCard', ANIMATION_MS],
            ['discardTableCard', ANIMATION_MS * 1.5],
            ['reserveDestination', ANIMATION_MS],
            ['score', ANIMATION_MS],
            ['bracelet', ANIMATION_MS],
            ['recruit', ANIMATION_MS],
            ['cardDeckReset', undefined],
            ['lastTurn', 1],
        ];
        notifs.forEach(function (notif) {
            dojo.subscribe(notif[0], _this, function (notifDetails) {
                log("notif_".concat(notif[0]), notifDetails.args);
                var promise = _this["notif_".concat(notif[0])](notifDetails.args);
                // tell the UI notification ends, if the function returned a promise
                promise === null || promise === void 0 ? void 0 : promise.then(function () { return _this.notifqueue.onSynchronousNotificationEnd(); });
            });
            _this.notifqueue.setSynchronous(notif[0], notif[1]);
        });
    };
    Knarr.prototype.notif_playCard = function (args) {
        var playerId = args.playerId;
        var playerTable = this.getPlayerTable(playerId);
        playerTable.playCard(args.card);
        this.updateGains(playerId, args.effectiveGains);
    };
    Knarr.prototype.notif_takeCard = function (args) {
        var playerId = args.playerId;
        var currentPlayer = this.getPlayerId() == playerId;
        var playerTable = this.getPlayerTable(playerId);
        (currentPlayer ? playerTable.hand : playerTable.voidStock).addCard(args.card);
    };
    Knarr.prototype.notif_newTableCard = function (args) {
        this.tableCenter.cardDeck.setCardNumber(args.cardDeckCount, args.cardDeckTop);
        this.tableCenter.newTableCard(args.card);
    };
    Knarr.prototype.notif_takeDestination = function (args) {
        var playerId = args.playerId;
        this.getPlayerTable(playerId).destinations.addCard(args.destination);
        this.updateGains(playerId, args.effectiveGains);
    };
    Knarr.prototype.notif_discardCards = function (args) {
        var _this = this;
        this.tableCenter.cardDiscard.addCards(args.cards, undefined, undefined, 50).then(function () { return _this.tableCenter.setDiscardCount(args.cardDiscardCount); });
    };
    Knarr.prototype.notif_newTableDestination = function (args) {
        this.tableCenter.newTableDestination(args.destination, args.letter, args.destinationDeckCount, args.destinationDeckTop);
    };
    Knarr.prototype.notif_score = function (args) {
        this.setScore(args.playerId, +args.newScore);
    };
    Knarr.prototype.notif_bracelet = function (args) {
        this.setBracelets(args.playerId, +args.newScore);
    };
    Knarr.prototype.notif_recruit = function (args) {
        this.setRecruits(args.playerId, +args.newScore);
    };
    Knarr.prototype.notif_trade = function (args) {
        var playerId = args.playerId;
        this.updateGains(playerId, args.effectiveGains);
    };
    Knarr.prototype.notif_takeDeckCard = function (args) {
        var playerId = args.playerId;
        var playerTable = this.getPlayerTable(playerId);
        playerTable.playCard(args.card, document.getElementById('board'));
        this.tableCenter.cardDeck.setCardNumber(args.cardDeckCount, args.cardDeckTop);
    };
    Knarr.prototype.notif_discardTableCard = function (args) {
        this.tableCenter.cardDiscard.addCard(args.card);
    };
    Knarr.prototype.notif_reserveDestination = function (args) {
        var playerId = args.playerId;
        var playerTable = this.getPlayerTable(playerId);
        playerTable.reserveDestination(args.destination);
    };
    Knarr.prototype.notif_cardDeckReset = function (args) {
        this.tableCenter.cardDeck.setCardNumber(args.cardDeckCount, args.cardDeckTop);
        this.tableCenter.setDiscardCount(args.cardDiscardCount);
        return this.tableCenter.cardDeck.shuffle();
    };
    /**
     * Show last turn banner.
     */
    Knarr.prototype.notif_lastTurn = function (animate) {
        if (animate === void 0) { animate = true; }
        dojo.place("<div id=\"last-round\">\n            <span class=\"last-round-text ".concat(animate ? 'animate' : '', "\">").concat(_("This is the final round!"), "</span>\n        </div>"), 'page-title');
    };
    Knarr.prototype.getGain = function (type) {
        switch (type) {
            case 1: return _("Victory Point");
            case 2: return _("Bracelet");
            case 3: return _("Recruit");
            case 4: return _("Reputation");
            case 5: return _("Card");
        }
    };
    Knarr.prototype.getTooltipGain = function (type) {
        return "".concat(this.getGain(type), " (<div class=\"icon\" data-type=\"").concat(type, "\"></div>)");
    };
    Knarr.prototype.getColor = function (color) {
        switch (color) {
            case 1: return _("Red");
            case 2: return _("Yellow");
            case 3: return _("Green");
            case 4: return _("Blue");
            case 5: return _("Purple");
        }
    };
    Knarr.prototype.getTooltipColor = function (color) {
        return "".concat(this.getColor(color), " (<div class=\"color\" data-color=\"").concat(color, "\"></div>)");
    };
    /* This enable to inject translatable styled things to logs or action bar */
    /* @Override */
    Knarr.prototype.format_string_recursive = function (log, args) {
        try {
            if (log && args && !args.processed) {
                if (args.gains && (typeof args.gains !== 'string' || args.gains[0] !== '<')) {
                    var entries = Object.entries(args.gains);
                    args.gains = entries.length ? entries.map(function (entry) { return "<strong>".concat(entry[1], "</strong> <div class=\"icon\" data-type=\"").concat(entry[0], "\"></div>"); }).join(' ') : "<strong>".concat(_('nothing'), "</strong>");
                }
                for (var property in args) {
                    if (['number', 'color', 'card_color', 'card_type', 'artifact_name'].includes(property) && args[property][0] != '<') {
                        args[property] = "<strong>".concat(_(args[property]), "</strong>");
                    }
                }
            }
        }
        catch (e) {
            console.error(log, args, "Exception thrown", e.stack);
        }
        return this.inherited(arguments);
    };
    return Knarr;
}());
define([
    "dojo", "dojo/_base/declare",
    "ebg/core/gamegui",
    "ebg/counter",
    "ebg/stock"
], function (dojo, declare) {
    return declare("bgagame.knarr", ebg.core.gamegui, new Knarr());
});
