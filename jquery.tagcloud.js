/**
 * jQuery plugin for tag cloud, showing bigger tags in the center
 * @version    2021.03.26
 * @repository https://github.com/peterthoeny/jquery.tagcloud
 * @copyright  2021 Peter Thoeny, https://github.com/peterthoeny
 * @license    Apache License 2.0, http://www.apache.org/licenses/
 */
(function($) {

    'use strict';

    let debug = true;

    function debugLog(msg) {
        if(debug) {
           console.log('- tagCloud: ' + msg);
        }
    }

    $.fn.tagCloud = function(options) {
        let self = $(this);
        options = $.extend({}, $.fn.tagCloud.defaults, options);
        if(options.debug != undefined) {
           debug = options.debug;
        }
        debugLog('options: ' + JSON.stringify(options, null, ''));
        let tagName = self.prop('tagName');
        if(tagName === 'UL') {
            if(!options.data) {
                options.data = [];
            }
            self.find('li').each(function(idx, elem) {
                let weight = $(elem).data('weight');
                if(weight == undefined) {
                    weight = $(elem).find(':first-child').data('weight');
                }
                let href = $(elem).find('a').attr('href') || '';
                let tag = $(elem).text() || '?';
                debugLog(weight +', '+href+', '+tag+', '+$(elem).html());
                if(options.data[idx]) {
                    if(weight != undefined) {
                        options.data[idx].weight = weight;
                    }
                    if(href) {
                        options.data[idx].link = href;
                    }
                    options.data[idx].tag = tag;
                } else {
                    options.data.push({ tag: tag, link: href, weight: weight })
                }
            });
            self.hide();
            if(self.next().hasClass('jqTcContainer')) {
                self.next().remove();
            }
            self.after('<div></div>');
            self = self.next();
        }
        let css = {};
        Object.keys(options.container).forEach(function(key) {
            css[key] = (options[key] != undefined) ? options[key] : options.container[key];
        });
        self.addClass('jqTcContainer').css(css);
        let containerWidth = options.container.width;
        let minWeight = 100000000;
        let maxWeight = -100000000;
        let minFontSize = options.tag.minFontSize;
        let maxFontSize = options.tag.maxFontSize;
        options.data.forEach(function(item) {
            if(item.weight < minWeight) {
                minWeight = item.weight;
            }
            if(item.weight > maxWeight) {
                maxWeight = item.weight;
            }
            return item;
        });
        let a = (maxFontSize - minFontSize) / (maxWeight - minWeight);
        let b = minFontSize - (minWeight * a);
        debugLog('minWeight: '+minWeight+', maxWeight: '+maxWeight+', a: '+a+', b: '+b);
        let tags = options.data.sort(function(a, b) {
            if(a.weight > b.weight) {
                return -1;
            } else if(a.weight < b.weight) {
                return 1;
            }
            return 0;
        }).map(function(item) {
            let size = parseInt((a * item.weight + b) * 10, 10) / 10;
            let html = item.link ? '<a href="" target="_blank">' + item.tag + '</a>' : item.tag;
            html = '<span class="jqTcTag" style="font-size: ' + size + 'px">' + html + '</span>';
            self.html(html); // set temporarily to get width and height
            let tagElem = self.find('span');
            item.width = tagElem.outerWidth();
            item.height = tagElem.outerHeight();
            item.html = html;
            item.ttLength = tagElem.length;
            item.ttHtml = self.text();
            return item;
        });
        debugLog('tags: ' + JSON.stringify(tags, null, ' '))
        let rows = [];
        let cells = [];
        let width = 0;
        let addRight = true;
        let addBottom = true;
        let padding = 2 * 5 + 5;
        let containerPadding = padding;
        let tagMargin = 2 * 10 + 5;
        let verticalAlign = 'middle';
        tags.forEach(function(item) {
            if(width + item.width + tagMargin >= containerWidth - containerPadding) {
                let rowHtml = '<tr><td style="vertical-align: ' + verticalAlign + ';">' + cells.join('') + '</td></tr>';
                if(addBottom) {
                    rows.push(rowHtml);
                    verticalAlign = 'bottom';
                } else {
                    rows.unshift(rowHtml);
                    verticalAlign = 'top';
                }
                addBottom = !addBottom;
                containerPadding += 1.5 * padding;
                cells = [];
                width = 0;
            }
            if(addRight) {
                cells.push(item.html);
            } else {
                cells.unshift(item.html);
            }
            addRight = !addRight;
            width = width + item.width + tagMargin;
        });
        let rowHtml = '<tr><td style="vertical-align: ' + verticalAlign + ';">' + cells.join('') + '</td></tr>';
        if(addBottom) {
            rows.push(rowHtml);
        } else {
            rows.unshift(rowHtml);
        }
        let html = '<table class="jqTcTable">' + rows.join('') + '</table>';
        self.html(html).find('.jqTcTag').css(options.tag);
    };

    $.fn.tagCloud.defaults = {
        container: {
            width:  500,
            height: 'auto',
            backgroundColor: '#f0f0f0',
            color:  '#666666',
            padding: '10px 5px',
            fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif'
        },
        tag: {
            minFontSize: 10,    // min font size in pixels
            maxFontSize: 40,    // max font size in pixels
        }
    };

})(jQuery);
