var CB = {
    beautify: function () {
        CB.createArray();
        CB.format();
        document.getElementById('text').value = CB.text;
        CB.clear();
    },
    clear: function () {
        CB.colonStack = [];
        CB.condArray = [];
        CB.tabLevel = [];
        CB.text = '';
        CB.typeStack = [];
    },
    colonStack: [],
    condArray: [],
    createArray: function () {
        /*
         * Establish the following variables:
         * condReg: array of indeces matching the string '[[?' which marks the beginning of a conditional
         * brackReg: array of indeces matching the string '[[' which marks the beginning of an S-Tag
         * colonReg: array of indeces matching the string '::' which marks the sections of a conditional
         * condEndReg: array of indeces matching the string ']]' which marks the end of a conditional or an S-Tag
         * condMatch, brackMatch, colonMatch, condEndMatch: temporary variables that hold matches found through exec()
         */

        var condReg = /\[\[\?/g, condMatch,
            brackReg = /\[\[[^\?]/g, brackMatch,
            colonReg = /::/g, colonMatch,
            condEndReg = /\]\]/g, condEndMatch;

        /*
         * CB.text: removes \n and \t characters from the text in the textarea to remove all previous formatting
         */

        CB.text = document.getElementById('text').value.replace(/[\t\n]/g, '').replace(/  /g, '');
        /*
         * Populate CB.condArray:
         * Push the index of each regular expression match found above into an array with a qualifier tagged on the end.
         * 'q' marks the beginning of a conditional statement (q stands for question mark)
         * 'b' marks the beginning of an S-Tag (b stands for bracket)
         * 'c' marks the beginning of a boolean logic section marked off by the double colon character (c stands for colon)
         * 'e' marks the end of a conditional statement or S-Tag (e stands for end)
         */

        while ((condMatch = condReg.exec(CB.text)) !== null) {
            CB.condArray.push(condMatch.index + 'q');
        }
        while ((brackMatch = brackReg.exec(CB.text)) !== null) {
            CB.condArray.push(brackMatch.index + 'b');
        }
        while ((colonMatch = colonReg.exec(CB.text)) !== null) {
            CB.condArray.push(colonMatch.index + 'c');
        }
        while ((condEndMatch = condEndReg.exec(CB.text)) !== null) {
            CB.condArray.push(condEndMatch.index + 'e');
        }

        /*
         * Sort CB.condArray numerically in ascending order
         */

        CB.condArray.sort(function (a, b) {
            return parseInt(a) - parseInt(b);
        });
    },
    format: function () {
        /* 
         * Loop through each value in CB.condArray and insert \n and \t characters based on the character sequence located at the index specified by CB.condArray[i]:
         * If type is 'q', add a \n character and CB.tabLevel \t characters unless the conditional begins in the first character of CB.text. Then, increment CB.tabLevel, push 'q' to CB.typeStack, and push 0 to CB.colonStack.
         * If type is 'b', simply push 'b' to CB.typeStack so that when an ending bracket is encountered it doesn't mistake an S-Tag ending bracket for a conditional ending bracket.
         * If type is 'c', first increment the last element of CB.colonStack:
         *   If the value of CB.getLastElement(CB.colonStack) is 1, do nothing.
         *   If the value of CB.getLastElement(CB.colonStack) is 2, make sure there is not another colon right next to it because that means there's no content. Also make sure that it is not immediately followed by a conditional.
         *     If neither of the previous conditions are met, you'll want to put a \n and CB.tabLevel \t's after the colon (index + 2).
         *   If the value of CB.getLastElement(CB.colonStack) is 3, put \n and CB.tabLevel - 1 \t's at index. If the colon is not immediately followed by an ending bracket or another conditional, put an \n and CB.tabLevel \t's after the colon.
         * If type is 'e', check if we are ending a bracket (b) or a conditional (q).
         *   If the value of CB.getLastElement(CB.typeStack) is 'q', we are ending a conditional and must first check to see if the ending bracket is immediately preceded by a colon. If not, then put a \n and CB.tabLevel - 1 \t's at index. Decrement CB.tabLevel.
         *   Regardless if type is 'b' or 'q', run CB.typeStack.pop().
         */

        var i = 0;

        for (; i < CB.condArray.length; i++) {
            var index = parseInt(CB.condArray[i]), type = CB.getLastElement(CB.condArray[i]);
            switch (type) {
                case 'q':
                    if (index !== 0) {
                        index += CB.insert(CB.tabLevel, index);
                    }
                    CB.tabLevel++;
                    CB.typeStack.push('q');
                    CB.colonStack.push(0);
                    break;
                case 'b':
                    CB.typeStack.push('b');
                    break;
                case 'c':
                    var lastColon = CB.getLastElement(CB.colonStack, 'increment');
                    if (lastColon === 2) {
                        if (!((('c' === CB.getLastElement(CB.condArray[i+1])) || ('q' === CB.getLastElement(CB.condArray[i+1]))) && (index + 2) === parseInt(CB.condArray[i+1]))) {
                            index += CB.insert(CB.tabLevel, index + 2);
                        }
                    }
                    if (lastColon === 3) {
                        index += CB.insert(CB.tabLevel - 1, index);
                        if (!((('e' === CB.getLastElement(CB.condArray[i+1])) || ('q' === CB.getLastElement(CB.condArray[i+1]))) && (index + 2) === parseInt(CB.condArray[i+1]))) {
                            index += CB.insert(CB.tabLevel, index + 2);
                        }
                        CB.colonStack.pop()
                    }
                    break;
                case 'e':
                    if (CB.getLastElement(CB.typeStack) === 'q') {
                        if (!('c' === CB.getLastElement(CB.condArray[i-1]) && (index - 2) === parseInt(CB.condArray[i-1]))) {
                            index += CB.insert(CB.tabLevel - 1, index);
                        }
                        CB.tabLevel--;
                    }
                    CB.typeStack.pop();
                    break;
                default:
                    break;
            }
        }
    },
    getLastElement: function (obj, increment) {
        /*
         * Simply returns the last element of an array or string. The increment boolean is added in the event you need to increment the element before returning it.
         */
        if(increment) {
            obj[obj.length-1]++;
        }
        return obj[obj.length - 1];
    },
    insert: function (numberOfTabs, index) {
        /*
         * Inserts a string into CB.text at the specified index. After inserting, increase the indeces in CB.condArray by str.length so that they will correspond to the new length of CB.text.
         * Return the length of str so that the index can be properly adjusted after insertion.
         */
        var str = '';
        str += '\n';
        for (var i = 0; i < numberOfTabs; i++) {
            str += '    ';
        }
        CB.text = CB.text.substring(0, index) + str + CB.text.substring(index, CB.text.length);
        for (var i = 0; i < CB.condArray.length; i++) {
            var num = parseInt(CB.condArray[i]), type = CB.getLastElement(CB.condArray[i]);
            if (num >= index) {
                CB.condArray[i] = (num + str.length) + type;
            }
        }
        return str.length;
    },
    tabLevel: 0,
    text: '',
    typeStack: [],
    uglify: function () {
        document.getElementById('text').value = document.getElementById('text').value.replace(/[\t\n]/g, '').replace(/  /g, '');
    }
};