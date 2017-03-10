(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*
 * Copyright (c) 2017 Allan Pichardo.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
"use strict";
/// <reference path="../../node_modules/@types/jquery/index.d.ts" />
// Class calls '/diff' route. 
// Work-around until we get ajax request to pf to work on localhost
var Pagefreezer = (function () {
    function Pagefreezer() {
    }
    Pagefreezer.diffPages = function (url1, url2, callback) {
        $.ajax({
            type: "GET",
            url: Pagefreezer.DIFF_API_URL,
            dataType: "json",
            jsonpCallback: callback,
            data: {
                old_url: url1,
                new_url: url2,
                as: "json",
            },
            success: callback,
            error: function (error) {
                console.log(error);
            },
            headers: { "x-api-key": "" }
        });
    };
    return Pagefreezer;
}());
Pagefreezer.DIFF_API_URL = "/diff";
Pagefreezer.API_KEY = "";
exports.Pagefreezer = Pagefreezer;

},{}],2:[function(require,module,exports){
/*
 * Copyright (c) 2017 Allan Pichardo.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
"use strict";
var Pagefreezer_1 = require("./Pagefreezer");
$(document).ready(function () {
    console.log("ready");
    toggleProgressbar(false);
    $('#submitButton').click(function () {
        runDiff($('#url1').val(), $('#url2').val());
    });
    $('#toggle_view').click(toggleView);
    // Load Google api
    gapi.load('client', start);
    setPagination();
});
function setPagination() {
    var urlParams = new URLSearchParams(window.location.search);
    var index = parseInt(urlParams.get('index')) || 2;
    $('#prev_index').text("<-- Row " + (index - 1)).attr('href', "/diffbyindex?index=" + (index - 1));
    $('#next_index').text("Row " + (index + 1) + " -->").attr('href', "/diffbyindex?index=" + (index + 1));
}
function start() {
    $.getJSON('./config.json', function (data) {
        var API_KEY = data.API_KEY;
        // 2. Initialize the JavaScript client library.
        // !! Work around because gapi.client.init is not in types file 
        gapi.client.init({ 'apiKey': API_KEY });
        $('#diff_by_index').click(function () {
            var urlParams = new URLSearchParams(window.location.search);
            var index = parseInt(urlParams.get('index'));
            showPage(index);
        });
    })
        .fail(function () {
        console.error('Couldn\'t find api key');
    });
}
;
function showPage(row_index) {
    // link to test spreadsheet: https://docs.google.com/spreadsheets/d/17QA_C2-XhLefxZlRKw74KDY3VNstbPvK3IHWluDJMGQ/edit#gid=0
    var sheetID = '17QA_C2-XhLefxZlRKw74KDY3VNstbPvK3IHWluDJMGQ';
    var range = "A" + row_index + ":AG" + row_index;
    // Info on spreadsheets.values.get: https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/get
    var path = "https://sheets.googleapis.com/v4/spreadsheets/" + sheetID + "/values/" + range;
    gapi.client.request({
        'path': path,
    }).then(function (response) {
        // If we need to write to spreadsheets: 
        // 1) Get started: https://developers.google.com/sheets/api/quickstart/js
        // 2) Read/write docs: https://developers.google.com/sheets/api/guides/values
        var values = response.result.values;
        if (values) {
            var row_data = values[0];
            var old_url = row_data[8];
            var new_url = row_data[9];
            console.log(row_data);
            showDiffMetadata(row_data);
        }
        else {
            $('#diff_title').text('No data found');
        }
    }, function (response) {
        console.error('Error: ' + response.result.error.message);
    });
}
function runDiff(old_url, new_url) {
    toggleProgressbar(true);
    Pagefreezer_1.Pagefreezer.diffPages(old_url, new_url, function (data, status) {
        console.log(data);
        loadIframe(data.result.output.html);
        toggleProgressbar(false);
    });
}
function loadIframe(html_embed) {
    // inject html
    var iframe = document.getElementById('diff_view');
    iframe.setAttribute('srcdoc', html_embed);
    iframe.onload = function () {
        // inject diff css
        var frm = frames['diff_view'].contentDocument;
        var otherhead = frm.getElementsByTagName("head")[0];
        var link = frm.createElement("link");
        link.setAttribute("rel", "stylesheet");
        link.setAttribute("type", "text/css");
        link.setAttribute("href", window.location.origin + "/css/diff.css");
        otherhead.appendChild(link);
        // set dimensions
        // iframe.setAttribute('width', (iframe as any).contentWindow.document.body.scrollWidth);
        iframe.setAttribute('height', iframe.contentWindow.document.body.scrollHeight);
    };
}
function showDiffMetadata(data) {
    var index = data[0] || 'No index';
    var title = data[5] || 'No title';
    var url = data[6] || 'No url';
    $('#diff_title').text(index + " - " + title + " : ");
    $('#diff_page_url').attr('href', "http://" + url).text(url);
    // Magic numbers! Match with column indexes from google spreadsheet.
    // Hack because we don't get any type of metadata, just an array
    for (var i = 15; i <= 32; i++) {
        $("#cbox" + i).prop('checked', data[i]);
    }
}
function toggleProgressbar(isVisible) {
    if (isVisible) {
        $('.progress').show();
    }
    else {
        $('.progress').hide();
    }
}
function toggleView(e) {
    e.preventDefault();
    $('.info-text').toggle();
    $('#inspectorView').toggleClass('short-view');
}

},{"./Pagefreezer":1}]},{},[2,1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvc2NyaXB0cy9QYWdlZnJlZXplci50cyIsInNyYy9zY3JpcHRzL21haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTs7Ozs7Ozs7R0FRRzs7QUFFSCxvRUFBb0U7QUEyQnBFLDhCQUE4QjtBQUM5QixtRUFBbUU7QUFDbkU7SUFBQTtJQTBCQSxDQUFDO0lBckJpQixxQkFBUyxHQUF2QixVQUF3QixJQUFZLEVBQUUsSUFBWSxFQUFFLFFBQWlFO1FBRWpILENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDSCxJQUFJLEVBQUUsS0FBSztZQUNYLEdBQUcsRUFBRSxXQUFXLENBQUMsWUFBWTtZQUM3QixRQUFRLEVBQUUsTUFBTTtZQUNoQixhQUFhLEVBQUUsUUFBUTtZQUN2QixJQUFJLEVBQUU7Z0JBQ0YsT0FBTyxFQUFFLElBQUk7Z0JBQ2IsT0FBTyxFQUFFLElBQUk7Z0JBQ2IsRUFBRSxFQUFFLE1BQU07YUFDYjtZQUNELE9BQU8sRUFBRSxRQUFRO1lBQ2pCLEtBQUssRUFBRSxVQUFTLEtBQUs7Z0JBQ2pCLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdkIsQ0FBQztZQUNELE9BQU8sRUFBRSxFQUFDLFdBQVcsRUFBRSxFQUFFLEVBQUM7U0FDN0IsQ0FBQyxDQUFDO0lBRVAsQ0FBQztJQUVMLGtCQUFDO0FBQUQsQ0ExQkEsQUEwQkM7QUF4QmlCLHdCQUFZLEdBQUcsT0FBTyxDQUFDO0FBQ3ZCLG1CQUFPLEdBQUcsRUFBRSxDQUFDO0FBSGxCLGtDQUFXOzs7QUN2Q3hCOzs7Ozs7OztHQVFHOztBQUVILDZDQUEwQztBQUUxQyxDQUFDLENBQUUsUUFBUSxDQUFFLENBQUMsS0FBSyxDQUFDO0lBQ2hCLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDckIsaUJBQWlCLENBQUMsS0FBSyxDQUFDLENBQUM7SUFFekIsQ0FBQyxDQUFD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QztRQUM1QixDQUFDLENBQUMsVUFBUSxDQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzVDLENBQUM7QUFDTCxDQUFDO0FBRUQsMkJBQTJCLFNBQWtCO0lBQ3pDLEVBQUUsQ0FBQSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDWCxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDMUIsQ0FBQztJQUFDLElBQUksQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO0lBQzFCLENBQUM7QUFDTCxDQUFDO0FBRUQsb0JBQW9CLENBQVE7SUFDeEIsQ0FBQyxDQUFDLGNBQWMsRUFBRSxDQUFDO0lBQ25CLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUN6QixDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUM7QUFDbEQsQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKlxuICogQ29weXJpZ2h0IChjKSAyMDE3IEFsbGFuIFBpY2hhcmRvLlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG4gKi9cblxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uLy4uL25vZGVfbW9kdWxlcy9AdHlwZXMvanF1ZXJ5L2luZGV4LmQudHNcIiAvPlxuXG5leHBvcnQgaW50ZXJmYWNlIFBhZ2VmcmVlemVyUmVzcG9uc2Uge1xuICAgIHN0YXR1czogc3RyaW5nO1xuICAgIHJlc3VsdDogUmVzdWx0O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJlc3VsdCB7XG4gICAgc3RhdHVzOiBzdHJpbmc7XG4gICAgb3V0cHV0OiBPdXRwdXQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgT3V0cHV0IHtcbiAgICBodG1sOiBzdHJpbmc7XG4gICAgZGlmZnM6IERpZmY7XG4gICAgcmF3SHRtbDI6IHN0cmluZztcbiAgICByYXdIdG1sMTogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIERpZmYge1xuXG4gICAgbmV3OiBzdHJpbmc7XG4gICAgb2xkOiBzdHJpbmc7XG4gICAgY2hhbmdlOiBudW1iZXI7XG4gICAgb2Zmc2V0OiBudW1iZXI7XG59XG5cbi8vIENsYXNzIGNhbGxzICcvZGlmZicgcm91dGUuIFxuLy8gV29yay1hcm91bmQgdW50aWwgd2UgZ2V0IGFqYXggcmVxdWVzdCB0byBwZiB0byB3b3JrIG9uIGxvY2FsaG9zdFxuZXhwb3J0IGNsYXNzIFBhZ2VmcmVlemVyIHtcblxuICAgIHB1YmxpYyBzdGF0aWMgRElGRl9BUElfVVJMID0gXCIvZGlmZlwiO1xuICAgIHB1YmxpYyBzdGF0aWMgQVBJX0tFWSA9IFwiXCI7XG5cbiAgICBwdWJsaWMgc3RhdGljIGRpZmZQYWdlcyh1cmwxOiBzdHJpbmcsIHVybDI6IHN0cmluZywgY2FsbGJhY2s6IChyZXNwb25zZTogUGFnZWZyZWV6ZXJSZXNwb25zZSwgc3RhdHVzOiBzdHJpbmcpID0+IHZvaWQpIHtcblxuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdHlwZTogXCJHRVRcIixcbiAgICAgICAgICAgIHVybDogUGFnZWZyZWV6ZXIuRElGRl9BUElfVVJMLFxuICAgICAgICAgICAgZGF0YVR5cGU6IFwianNvblwiLFxuICAgICAgICAgICAganNvbnBDYWxsYmFjazogY2FsbGJhY2ssXG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgb2xkX3VybDogdXJsMSxcbiAgICAgICAgICAgICAgICBuZXdfdXJsOiB1cmwyLFxuICAgICAgICAgICAgICAgIGFzOiBcImpzb25cIixcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdWNjZXNzOiBjYWxsYmFjayxcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbihlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBoZWFkZXJzOiB7XCJ4LWFwaS1rZXlcIjogXCJcIn1cbiAgICAgICAgfSk7XG5cbiAgICB9XG5cbn0iLCIvKlxuICogQ29weXJpZ2h0IChjKSAyMDE3IEFsbGFuIFBpY2hhcmRvLlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG4gKi9cblxuaW1wb3J0IHtQYWdlZnJlZXplcn0gZnJvbSBcIi4vUGFnZWZyZWV6ZXJcIjtcblxuJCggZG9jdW1lbnQgKS5yZWFkeShmdW5jdGlvbigpIHtcbiAgICBjb25zb2xlLmxvZyhcInJlYWR5XCIpO1xuICAgIHRvZ2dsZVByb2dyZXNzYmFyKGZhbHNlKTtcblxuICAgICQoJyNzdWJtaXRCdXR0b24nKS5jbGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJ1bkRpZmYoXG4gICAgICAgICAgICAkKCcjdXJsMScpLnZhbCgpLCBcbiAgICAgICAgICAgICQoJyN1cmwyJykudmFsKClcbiAgICAgICAgKTtcbiAgICB9KTtcblxuICAgICQoJyN0b2dnbGVfdmlldycpLmNsaWNrKHRvZ2dsZVZpZXcpO1xuXG4gICAgLy8gTG9hZCBHb29nbGUgYXBpXG4gICAgZ2FwaS5sb2FkKCdjbGllbnQnLCBzdGFydCk7XG5cbiAgICBzZXRQYWdpbmF0aW9uKClcbn0pXG5cbmZ1bmN0aW9uIHNldFBhZ2luYXRpb24oKSB7XG4gICAgdmFyIHVybFBhcmFtcyA9IG5ldyBVUkxTZWFyY2hQYXJhbXMod2luZG93LmxvY2F0aW9uLnNlYXJjaCk7XG4gICAgdmFyIGluZGV4ID0gcGFyc2VJbnQodXJsUGFyYW1zLmdldCgnaW5kZXgnKSkgfHwgMjtcbiAgICAkKCcjcHJldl9pbmRleCcpLnRleHQoYDwtLSBSb3cgJHtpbmRleC0xfWApLmF0dHIoJ2hyZWYnLCBgL2RpZmZieWluZGV4P2luZGV4PSR7aW5kZXgtMX1gKTtcbiAgICAkKCcjbmV4dF9pbmRleCcpLnRleHQoYFJvdyAke2luZGV4KzF9IC0tPmApLmF0dHIoJ2hyZWYnLCBgL2RpZmZieWluZGV4P2luZGV4PSR7aW5kZXgrMX1gKTtcbn1cblxuZnVuY3Rpb24gc3RhcnQoKSB7XG4gICAgJC5nZXRKU09OKCcuL2NvbmZpZy5qc29uJywgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgdmFyIEFQSV9LRVkgPSBkYXRhLkFQSV9LRVk7XG4gICAgICAgIC8vIDIuIEluaXRpYWxpemUgdGhlIEphdmFTY3JpcHQgY2xpZW50IGxpYnJhcnkuXG4gICAgICAgIC8vICEhIFdvcmsgYXJvdW5kIGJlY2F1c2UgZ2FwaS5jbGllbnQuaW5pdCBpcyBub3QgaW4gdHlwZXMgZmlsZSBcbiAgICAgICAgKGdhcGkgYXMgYW55KS5jbGllbnQuaW5pdCh7ICdhcGlLZXknOiBBUElfS0VZIH0pO1xuXG4gICAgICAgICQoJyNkaWZmX2J5X2luZGV4JykuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHVybFBhcmFtcyA9IG5ldyBVUkxTZWFyY2hQYXJhbXMod2luZG93LmxvY2F0aW9uLnNlYXJjaCk7XG4gICAgICAgICAgICB2YXIgaW5kZXggPSBwYXJzZUludCh1cmxQYXJhbXMuZ2V0KCdpbmRleCcpKTtcbiAgICAgICAgICAgIHNob3dQYWdlKGluZGV4KTtcbiAgICAgICAgfSlcbiAgICB9KVxuICAgIC5mYWlsKGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdDb3VsZG5cXCd0IGZpbmQgYXBpIGtleScpO1xuICAgIH0pO1xufTtcblxuZnVuY3Rpb24gc2hvd1BhZ2Uocm93X2luZGV4OiBudW1iZXIpIHtcbiAgICAvLyBsaW5rIHRvIHRlc3Qgc3ByZWFkc2hlZXQ6IGh0dHBzOi8vZG9jcy5nb29nbGUuY29tL3NwcmVhZHNoZWV0cy9kLzE3UUFfQzItWGhMZWZ4WmxSS3c3NEtEWTNWTnN0YlB2SzNJSFdsdURKTUdRL2VkaXQjZ2lkPTBcbiAgICB2YXIgc2hlZXRJRCA9ICcxN1FBX0MyLVhoTGVmeFpsUkt3NzRLRFkzVk5zdGJQdkszSUhXbHVESk1HUSdcbiAgICB2YXIgcmFuZ2UgPSBgQSR7cm93X2luZGV4fTpBRyR7cm93X2luZGV4fWBcblxuICAgIC8vIEluZm8gb24gc3ByZWFkc2hlZXRzLnZhbHVlcy5nZXQ6IGh0dHBzOi8vZGV2ZWxvcGVycy5nb29nbGUuY29tL3NoZWV0cy9hcGkvcmVmZXJlbmNlL3Jlc3QvdjQvc3ByZWFkc2hlZXRzLnZhbHVlcy9nZXRcbiAgICB2YXIgcGF0aCA9IGBodHRwczovL3NoZWV0cy5nb29nbGVhcGlzLmNvbS92NC9zcHJlYWRzaGVldHMvJHtzaGVldElEfS92YWx1ZXMvJHtyYW5nZX1gO1xuICAgIGdhcGkuY2xpZW50LnJlcXVlc3Qoe1xuICAgICAgICAncGF0aCc6IHBhdGgsXG4gICAgfSkudGhlbihmdW5jdGlvbiAocmVzcG9uc2U6IGFueSkge1xuICAgICAgICAvLyBJZiB3ZSBuZWVkIHRvIHdyaXRlIHRvIHNwcmVhZHNoZWV0czogXG4gICAgICAgIC8vIDEpIEdldCBzdGFydGVkOiBodHRwczovL2RldmVsb3BlcnMuZ29vZ2xlLmNvbS9zaGVldHMvYXBpL3F1aWNrc3RhcnQvanNcbiAgICAgICAgLy8gMikgUmVhZC93cml0ZSBkb2NzOiBodHRwczovL2RldmVsb3BlcnMuZ29vZ2xlLmNvbS9zaGVldHMvYXBpL2d1aWRlcy92YWx1ZXNcblxuICAgICAgICB2YXIgdmFsdWVzID0gcmVzcG9uc2UucmVzdWx0LnZhbHVlcztcbiAgICAgICAgaWYgKHZhbHVlcykge1xuICAgICAgICAgICAgdmFyIHJvd19kYXRhID0gdmFsdWVzWzBdO1xuICAgICAgICAgICAgdmFyIG9sZF91cmwgPSByb3dfZGF0YVs4XTtcbiAgICAgICAgICAgIHZhciBuZXdfdXJsID0gcm93X2RhdGFbOV07XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHJvd19kYXRhKTtcbiAgICAgICAgICAgIHNob3dEaWZmTWV0YWRhdGEocm93X2RhdGEpO1xuICAgICAgICAgICAgLy8gcnVuRGlmZihvbGRfdXJsLCBuZXdfdXJsKTtcbiAgICAgICAgICAgIFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJCgnI2RpZmZfdGl0bGUnKS50ZXh0KCdObyBkYXRhIGZvdW5kJylcbiAgICAgICAgfVxuICAgIH0sIGZ1bmN0aW9uIChyZXNwb25zZTogYW55KSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yOiAnICsgcmVzcG9uc2UucmVzdWx0LmVycm9yLm1lc3NhZ2UpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBydW5EaWZmKG9sZF91cmw6IHN0cmluZywgbmV3X3VybDogc3RyaW5nKSB7XG4gICAgdG9nZ2xlUHJvZ3Jlc3NiYXIodHJ1ZSk7XG4gICAgUGFnZWZyZWV6ZXIuZGlmZlBhZ2VzKFxuICAgICAgICBvbGRfdXJsLFxuICAgICAgICBuZXdfdXJsLFxuICAgICAgICBmdW5jdGlvbihkYXRhLCBzdGF0dXMpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgICAgICAgICBsb2FkSWZyYW1lKGRhdGEucmVzdWx0Lm91dHB1dC5odG1sKTtcbiAgICAgICAgICAgIHRvZ2dsZVByb2dyZXNzYmFyKGZhbHNlKTtcbiAgICB9KTtcbn1cbmZ1bmN0aW9uIGxvYWRJZnJhbWUoaHRtbF9lbWJlZDogc3RyaW5nKSB7XG4gICAgLy8gaW5qZWN0IGh0bWxcbiAgICB2YXIgaWZyYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RpZmZfdmlldycpO1xuICAgIGlmcmFtZS5zZXRBdHRyaWJ1dGUoJ3NyY2RvYycsIGh0bWxfZW1iZWQpO1xuXG4gICAgaWZyYW1lLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBpbmplY3QgZGlmZiBjc3NcbiAgICAgICAgdmFyIGZybSA9IChmcmFtZXMgYXMgYW55KVsnZGlmZl92aWV3J10uY29udGVudERvY3VtZW50O1xuICAgICAgICB2YXIgb3RoZXJoZWFkID0gZnJtLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiaGVhZFwiKVswXTtcbiAgICAgICAgdmFyIGxpbmsgPSBmcm0uY3JlYXRlRWxlbWVudChcImxpbmtcIik7XG4gICAgICAgIGxpbmsuc2V0QXR0cmlidXRlKFwicmVsXCIsIFwic3R5bGVzaGVldFwiKTtcbiAgICAgICAgbGluay5zZXRBdHRyaWJ1dGUoXCJ0eXBlXCIsIFwidGV4dC9jc3NcIik7XG4gICAgICAgIGxpbmsuc2V0QXR0cmlidXRlKFwiaHJlZlwiLCBgJHt3aW5kb3cubG9jYXRpb24ub3JpZ2lufS9jc3MvZGlmZi5jc3NgKTtcbiAgICAgICAgb3RoZXJoZWFkLmFwcGVuZENoaWxkKGxpbmspO1xuXG4gICAgICAgIC8vIHNldCBkaW1lbnNpb25zXG4gICAgICAgIC8vIGlmcmFtZS5zZXRBdHRyaWJ1dGUoJ3dpZHRoJywgKGlmcmFtZSBhcyBhbnkpLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQuYm9keS5zY3JvbGxXaWR0aCk7XG4gICAgICAgIGlmcmFtZS5zZXRBdHRyaWJ1dGUoJ2hlaWdodCcsKGlmcmFtZSBhcyBhbnkpLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQuYm9keS5zY3JvbGxIZWlnaHQpO1xuICAgIH07XG59XG5cbmZ1bmN0aW9uIHNob3dEaWZmTWV0YWRhdGEoZGF0YTogYW55KSB7XG4gICAgdmFyIGluZGV4ID0gZGF0YVswXSB8fCAnTm8gaW5kZXgnO1xuICAgIHZhciB0aXRsZSA9IGRhdGFbNV0gfHwgJ05vIHRpdGxlJztcbiAgICB2YXIgdXJsID0gZGF0YVs2XSB8fCAnTm8gdXJsJztcbiAgICAkKCcjZGlmZl90aXRsZScpLnRleHQoYCR7aW5kZXh9IC0gJHt0aXRsZX0gOiBgKTtcbiAgICAkKCcjZGlmZl9wYWdlX3VybCcpLmF0dHIoJ2hyZWYnLCBgaHR0cDovLyR7dXJsfWApLnRleHQodXJsKTtcblxuICAgIC8vIE1hZ2ljIG51bWJlcnMhIE1hdGNoIHdpdGggY29sdW1uIGluZGV4ZXMgZnJvbSBnb29nbGUgc3ByZWFkc2hlZXQuXG4gICAgLy8gSGFjayBiZWNhdXNlIHdlIGRvbid0IGdldCBhbnkgdHlwZSBvZiBtZXRhZGF0YSwganVzdCBhbiBhcnJheVxuICAgIGZvciAodmFyIGkgPSAxNTsgaSA8PSAzMjsgaSsrKSB7XG4gICAgICAgICQoYCNjYm94JHtpfWApLnByb3AoJ2NoZWNrZWQnLCBkYXRhW2ldKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHRvZ2dsZVByb2dyZXNzYmFyKGlzVmlzaWJsZTogYm9vbGVhbikge1xuICAgIGlmKGlzVmlzaWJsZSkge1xuICAgICAgICAkKCcucHJvZ3Jlc3MnKS5zaG93KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgJCgnLnByb2dyZXNzJykuaGlkZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gdG9nZ2xlVmlldyhlOiBFdmVudCkge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAkKCcuaW5mby10ZXh0JykudG9nZ2xlKCk7XG4gICAgJCgnI2luc3BlY3RvclZpZXcnKS50b2dnbGVDbGFzcygnc2hvcnQtdmlldycpO1xufVxuXG4vLyBRdWljayB0eXBlIGZvciBVUkxTZWFyY2hQYXJhbXMgXG5kZWNsYXJlIGNsYXNzIFVSTFNlYXJjaFBhcmFtcyB7XG4gICAgLyoqIENvbnN0cnVjdG9yIHJldHVybmluZyBhIFVSTFNlYXJjaFBhcmFtcyBvYmplY3QuICovXG4gICAgY29uc3RydWN0b3IoaW5pdD86IHN0cmluZ3wgVVJMU2VhcmNoUGFyYW1zKTtcblxuICAgIC8qKiBSZXR1cm5zIHRoZSBmaXJzdCB2YWx1ZSBhc3NvY2lhdGVkIHRvIHRoZSBnaXZlbiBzZWFyY2ggcGFyYW1ldGVyLiAqL1xuICAgIGdldChuYW1lOiBzdHJpbmcpOiBzdHJpbmc7XG59XG4iXX0=
