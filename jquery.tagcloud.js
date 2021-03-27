/**
 * jQuery plugin for tag cloud, showing bigger tags in the center
 * @version    2021.03.27
 * @repository https://github.com/peterthoeny/jquery.tagcloud
 * @author     Peter Thoeny, https://twiki.org/ & https://github.com/peterthoeny
 * @copyright  2021 Peter Thoeny, https://github.com/peterthoeny
 * @license    Apache License 2.0, http://www.apache.org/licenses/
 */
(function($) {

    'use strict';

    let debug = false;

    function debugLog(msg) {
        if(debug) {
           console.log('- tagCloud: ' + msg);
        }
    }

    function entityEncode(val) {
        val = val.toString()
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
        return val;
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
                        options.data[idx].weight = Number(weight);
                    }
                    if(href) {
                        options.data[idx].link = href;
                    }
                    options.data[idx].tag = tag;
                } else {
                    options.data.push({ tag: tag, link: href, weight: Number(weight) })
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
        let minWeight = 1000000000000;
        let maxWeight = -1000000000000;
        let minFontSize = options.tag.minFontSize || $.fn.tagCloud.defaults.tag.minFontSize;
        let maxFontSize = options.tag.maxFontSize || $.fn.tagCloud.defaults.tag.maxFontSize;
        debugLog('minFontSize: '+minFontSize+', maxFontSize: '+maxFontSize);
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
        }).map(function(item, idx) {
            let html = item.link ? '<a href="' + item.link + '" target="_blank">' + item.tag + '</a>' : item.tag;
            let size = parseInt((a * item.weight + b) * 10, 10) / 10;
            let attrs = [
                'class="jqTcTag"',
                'data-tag="' + entityEncode(item.tag) + '"',
                'data-link="' + entityEncode(item.link || '') + '"',
                'data-weight="' + item.weight + '"',
                'data-size="' + size + '"'
            ];
            let bgColor = item.bgColor || $.fn.tagCloud.defaults.backgroundColors[idx] || '';
            attrs.push('style="font-size: ' + size + 'px; background-color: ' + bgColor + ';"');
            if(item.tooltip) {
                attrs.push('title="' + entityEncode(item.tooltip) + '"');
            }
            html = '<span ' + attrs.join(' ') + '>' + html + '</span>';
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
        let tagStyle = {};
        Object.keys(options.tag).forEach(key => {
            if(!/^(minFontSize|maxFontSize)$/.test(key)) {
                tagStyle[key] = options.tag[key];
            }
        });
        self.html(html).find('.jqTcTag').css(tagStyle);
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
        },
        backgroundColors: [
            '#db843d', '#92a8cd', '#a47d7c', '#058dc7', '#50b432', '#ed561b', '#24cbe5', '#64e572',
            '#ff9655', '#d6cb54', '#6af9c4', '#b5ca92', '#2f7ed8', '#0d233a', '#8bbc21', '#910000',
            '#1aadce', '#492970', '#f28f43', '#77a1e5', '#c42525', '#a6c96a', '#db843d', '#92a8cd',
            '#a47d7c', '#058dc7', '#50b432', '#ed561b', '#24cbe5', '#64e572', '#ff9655', '#d6cb54',
            '#6af9c4', '#b5ca92', '#2f7ed8', '#0d233a', '#8bbc21', '#910000', '#1aadce', '#492970',
            '#f28f43', '#77a1e5', '#c42525', '#a6c96a', '#db843d', '#92a8cd', '#a47d7c', '#058dc7',
            '#50b432', '#ed561b', '#24cbe5', '#64e572', '#ff9655', '#d6cb54', '#6af9c4', '#b5ca92',
            '#2f7ed8', '#0d233a', '#8bbc21', '#910000', '#1aadce', '#492970', '#f28f43', '#77a1e5'
        ]
    };

})(jQuery);
