/*jslint browser: true, unparam: true */
/*global jQuery */

/*
* jQuery Password Strength plugin for Twitter Bootstrap
*
* Copyright (c) 2008-2013 Tane Piper
* Copyright (c) 2013 Alejandro Blanco
* Dual licensed under the MIT and GPL licenses.
*/

var ui = {};

(function ($, ui) {
    "use strict";

    var statusClasses = ["error", "warning", "success"];

    ui.getContainer = function (options, $el) {
        var $container;

        $container = $(options.ui.container);
        if (!($container && $container.length === 1)) {
            $container = $el.parent();
        }
        return $container;
    };

    ui.findElement = function ($container, viewport, cssSelector) {
        if (viewport) {
            return $container.find(viewport).find(cssSelector);
        }
        return $container.find(cssSelector);
    };

    ui.getUIElements = function (options, $el) {
        var $container, selector, result, target;

        if (options.instances.viewports) {
            return options.instances.viewports;
        }

        $container = ui.getContainer(options, $el);

        result = {};
        if (options.ui.bootstrap4) {
            selector = "progress.progress";
        } else {
            selector = "div.progress";
        }
        
        if(options.ui.progressBarLocation != false){
            target = $(options.ui.progressBarLocation);
        }else{
            target = $container;
        }

        result.$progressbar = ui.findElement(target, options.ui.viewports.progress, selector);
        
        if (options.ui.showVerdictsInsideProgressBar) {
            result.$verdict = result.$progressbar.find("span.password-verdict");
        }

        if (!options.ui.showPopover) {
            if (!options.ui.showVerdictsInsideProgressBar) {
                result.$verdict = ui.findElement($container, options.ui.viewports.verdict, "span.password-verdict");
            }
            result.$errors = ui.findElement($container, options.ui.viewports.errors, "ul.error-list");
        }

        options.instances.viewports = result;
        return result;
    };

    ui.initProgressBar = function (options, $el) {
        var $container = ui.getContainer(options, $el),
            progressbar = "<div class='progress'><div class='"; // Boostrap 2

        if (!options.ui.bootstrap2 && !options.ui.bootstrap4) {
            // Bootstrap 3
            progressbar += "progress-";
        }
        progressbar += "bar'>";
        if (options.ui.bootstrap4) {
            // Boostrap 4
            progressbar = "<progress class='progress' value='0' max='100'>";
        }
        if (options.ui.showVerdictsInsideProgressBar) {
            progressbar += "<span class='password-verdict'></span>";
        }
        if (options.ui.bootstrap4) {
            progressbar += "</progress>";
        } else {
            progressbar += "</div></div>";
        }

        if (options.ui.viewports.progress) {
            $container.find(options.ui.viewports.progress).append(progressbar);
        } else {
           if(options.ui.progressBarLocation != false){
                $(progressbar).appendTo(options.ui.progressBarLocation);
            }else{
                $(progressbar).insertAfter($el);
            }
        }
    };

    ui.initHelper = function (options, $el, html, viewport) {
        var $container = ui.getContainer(options, $el);
        if (viewport) {
            $container.find(viewport).append(html);
        } else {
            $(html).insertAfter($el);
        }
    };

    ui.initVerdict = function (options, $el) {
        ui.initHelper(options, $el, "<span class='password-verdict'></span>",
                        options.ui.viewports.verdict);
    };

    ui.initErrorList = function (options, $el) {
        ui.initHelper(options, $el, "<ul class='error-list'></ul>",
                        options.ui.viewports.errors);
    };

    ui.initPopover = function (options, $el) {
        $el.popover("destroy");
        $el.popover({
            html: true,
            placement: options.ui.popoverPlacement,
            trigger: "manual",
            content: " "
        });
    };

    ui.initUI = function (options, $el) {
        if (options.ui.showPopover) {
            ui.initPopover(options, $el);
        } else {
            if (options.ui.showErrors) { ui.initErrorList(options, $el); }
            if (options.ui.showVerdicts && !options.ui.showVerdictsInsideProgressBar) {
                ui.initVerdict(options, $el);
            }
        }
        if (options.ui.showProgressBar) {
            ui.initProgressBar(options, $el);
        }
    };

    ui.updateProgressBar = function (options, $el, cssClass, percentage) {
        var $progressbar = ui.getUIElements(options, $el).$progressbar,
            $bar = $progressbar.find(".progress-bar"),
            cssPrefix = "progress-";

        if (options.ui.bootstrap2) {
            $bar = $progressbar.find(".bar");
            cssPrefix = "";
        }

        $.each(options.ui.colorClasses, function (idx, value) {
            if (options.ui.bootstrap4) {
                $progressbar.removeClass(cssPrefix + value);
            } else {
                $bar.removeClass(cssPrefix + "bar-" + value);
            }
        });
        if (options.ui.bootstrap4) {
            $progressbar.addClass(cssPrefix + options.ui.colorClasses[cssClass]);
            $progressbar.val(percentage);
        } else {
            $bar.addClass(cssPrefix + "bar-" + options.ui.colorClasses[cssClass]);
            $bar.css("width", percentage + '%');
        }
    };

    ui.updateVerdict = function (options, $el, cssClass, text) {
        var $verdict = ui.getUIElements(options, $el).$verdict;
        $verdict.removeClass(options.ui.colorClasses.join(' '));
        if (cssClass > -1) {
            $verdict.addClass(options.ui.colorClasses[cssClass]);
        }
        $verdict.html(text);
    };

    ui.updateErrors = function (options, $el) {
        var $errors = ui.getUIElements(options, $el).$errors,
            html = "";
        $.each(options.instances.errors, function (idx, err) {
            html += "<li>" + err + "</li>";
        });
        $errors.html(html);
    };

    ui.updatePopover = function (options, $el, verdictText) {
        var popover = $el.data("bs.popover"),
            html = "",
            hide = true;

        if (options.ui.showVerdicts &&
                !options.ui.showVerdictsInsideProgressBar &&
                verdictText.length > 0) {
            html = "<h5><span class='password-verdict'>" + verdictText +
                "</span></h5>";
            hide = false;
        }
        if (options.ui.showErrors) {
            if (options.instances.errors.length > 0) {
                hide = false;
            }
            html += options.ui.popoverError(options.instances.errors);
        }

        if (hide) {
            $el.popover("hide");
            return;
        }

        if (options.ui.bootstrap2) { popover = $el.data("popover"); }

        if (popover.$arrow && popover.$arrow.parents("body").length > 0) {
            $el.find("+ .popover .popover-content").html(html);
        } else {
            // It's hidden
            popover.options.content = html;
            $el.popover("show");
        }
    };

    ui.updateFieldStatus = function (options, $el, cssClass) {
        var targetClass = options.ui.bootstrap2 ? ".control-group" : ".form-group",
            $container = $el.parents(targetClass).first();

        $.each(statusClasses, function (idx, css) {
            if (!options.ui.bootstrap2) { css = "has-" + css; }
            $container.removeClass(css);
        });

        cssClass = statusClasses[cssClass];
        if (!options.ui.bootstrap2) { cssClass = "has-" + cssClass; }
        $container.addClass(cssClass);
    };

    ui.percentage = function (score, maximun) {
        var result = Math.floor(100 * score / maximun);
        result = result <= 0 ? 1 : result; // Don't show the progress bar empty
        result = result > 100 ? 100 : result;
        return result;
    };

    ui.getVerdictAndCssClass = function (options, score) {
        var cssClass, verdictText, level;

        if (score <= 0) {
            cssClass = 0;
            level = -1;
            verdictText = options.ui.verdicts[0];
        } else if (score < options.ui.scores[0]) {
            cssClass = 0;
            level = 0;
            verdictText = options.ui.verdicts[0];
        } else if (score < options.ui.scores[1]) {
            cssClass = 0;
            level = 1;
            verdictText = options.ui.verdicts[1];
        } else if (score < options.ui.scores[2]) {
            cssClass = 1;
            level = 2;
            verdictText = options.ui.verdicts[2];
        } else if (score < options.ui.scores[3]) {
            cssClass = 1;
            level = 3;
            verdictText = options.ui.verdicts[3];
        } else {
            cssClass = 2;
            level = 4;
            verdictText = options.ui.verdicts[4];
        }

        return [verdictText, cssClass, level];
    };

    ui.updateUI = function (options, $el, score) {
        var cssClass, barPercentage, verdictText, verdictCssClass;

        cssClass = ui.getVerdictAndCssClass(options, score);
        verdictText = score === 0 ? '' : cssClass[0];
        cssClass = cssClass[1];
        verdictCssClass = options.ui.useVerdictCssClass ? cssClass : -1;

        if (options.ui.showProgressBar) {
            barPercentage = ui.percentage(score, options.ui.scores[3]);
            ui.updateProgressBar(options, $el, cssClass, barPercentage);
            if (options.ui.showVerdictsInsideProgressBar) {
                ui.updateVerdict(options, $el, verdictCssClass, verdictText);
            }
        }

        if (options.ui.showStatus) {
            ui.updateFieldStatus(options, $el, cssClass);
        }

        if (options.ui.showPopover) {
            ui.updatePopover(options, $el, verdictText);
        } else {
            if (options.ui.showVerdicts && !options.ui.showVerdictsInsideProgressBar) {
                ui.updateVerdict(options, $el, verdictCssClass, verdictText);
            }
            if (options.ui.showErrors) {
                ui.updateErrors(options, $el);
            }
        }
    };
}(jQuery, ui));
