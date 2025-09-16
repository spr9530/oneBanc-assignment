const Utility = require('./Utility');
const fs = require('fs');

const filePath = './master_data.csv'

class Child extends Utility {
    getMasterDataFilePath() {
        return filePath;
    }

    extractOtp(message) {
        if (!message) return "nan";

        // message = message.toLowerCase();
        // let cleanMsg = message.replace(/(\d{3,4})[/s-](\d{3,4})/g, "$1$2");

        let cleanMsg = refine(message)
        function refine(message) {
            let result = '';
            let buffer = '';
            let i = 0;

            while (i < message.length) {
                let ch = message[i];
                let code = ch.charCodeAt(0);
                if (code >= 65 && code <= 90) {
                    ch = String.fromCharCode(code + 32);
                }

                let isDigit = ch >= '0' && ch <= '9';

                if (isDigit) {
                    buffer += ch;

                    let nextChar = i + 1 < message.length ? message[i + 1] : '';
                    let nextCode = nextChar.charCodeAt(0);
                    if (nextChar && nextCode >= 65 && nextCode <= 90) {
                        nextChar = String.fromCharCode(nextCode + 32);
                    }
                    if (buffer.length >= 4) {
                        result += buffer;
                        buffer = '';
                    }

                    i++;
                } else if ((ch === '-' || ch === ' ') && i + 3 < message.length) {
                    let nextChar = message[i + 1];
                    let nextCode = nextChar.charCodeAt(0);
                    if (nextCode >= 65 && nextCode <= 90) {
                        nextChar = String.fromCharCode(nextCode + 32);
                    }
                    let nextIsDigit = nextChar >= '0' && nextChar <= '9';

                    if (nextIsDigit && buffer.length >= 3 && buffer.length <= 4) {
                        let j = i + 1;
                        let nextDigits = '';

                        while (j < message.length && message[j] >= '0' && message[j] <= '9' && nextDigits.length < 4) {
                            nextDigits += message[j];
                            j++;
                        }

                        if (nextDigits.length >= 3 && nextDigits.length <= 4) {
                            result += buffer + nextDigits;
                            buffer = '';
                            i = j;
                        } else {
                            result += buffer + ch;
                            buffer = '';
                            i++;
                        }
                    } else {
                        result += buffer + ch;
                        buffer = '';
                        i++;
                    }
                } else {
                    result += buffer + ch;
                    buffer = '';
                    i++;
                }
            }

            result += buffer;
            return result;
        }





        const regex = /(?<!\d)(\d{4,8})(?!\d)(?!\.\d+)/g;
        const keywordList = ["otp", "code", "verification", "enter", "use", "password", "delivery code", "one time pin", "confirmation"];
        const negativeKeywords = ["ebit", "sms", "call", "rs.", "xx ", " rs ", " a/c ", "ph:", "ending", "equest id ", "pool", "winners", "application", " account ", "account id"];
        const longNegative = ["out for pickup"];

        function hasNegativeKeywordBefore(msg, idx, window = 16) {
            let beforeText = msg.slice(Math.max(0, idx - window), idx);
            for (const word of negativeKeywords) {
                if (beforeText.includes(word)) return true;
            }
            return false;
        }

        let matches = [...cleanMsg.matchAll(regex)].map(found => ({
            value: found[0],
            index: found.index
        }));

        if (!matches.length) return "nan";


        function isStandalone(msg, num, idx) {
            if (idx >= 0 && idx <= 10) {
                const afterText = msg.slice(idx, idx + 10);
                if (negativeKeywords.some(kw => afterText.includes(kw))) {
                    return false
                }
            } else {
                const beforeText = msg.slice(Math.max(0, idx - 10), idx);
                if (negativeKeywords.some(kw => beforeText.includes(kw))) {
                    return false
                }
            }
            let before = msg[idx - 1] || " ";
            let after = msg[idx + num.length] || " ";
            let hyphen = msg[idx + num.length + 1] || " ";

            if (after === '+') return false;

            return /[\s,:<>#(-]/.test(before) && (/[\s.>")\-]/.test(after) || (/[\s.)]/.test(hyphen)));

        }
        function isPartOfDate(msg, num, idx) {
            const context = msg.slice(Math.max(0, idx - 14), idx + num.length + 10);
            const dateRegex = /\b(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2})\b/;
            return dateRegex.test(context);
        }

        function haslongNegativeKeyword(msg, num, idx) {
            const beforeText = msg.slice(Math.max(0, idx - 20), idx);
            if (longNegative.some(kw => beforeText.includes(kw))) {
                return false
            }
            let before = msg[idx - 1] || " ";
            let after = msg[idx + num.length] || " ";
            let hyphen = msg[idx + num.length + 1] || " ";

            if (after === '+') return false;

            return /[\s,:<>#(-]/.test(before) && (/[\s.>)\-]/.test(after) || (/[\s.)]/.test(hyphen)))
        }

        let foundKeyword;
        let keywordIndex;

        function findKeyword() {
            for (const value of keywordList) {
                let idx = cleanMsg.indexOf(value);
                if (idx !== -1) {
                    foundKeyword = true;
                    keywordIndex = idx;
                }
            }
        }
        findKeyword()


        if (foundKeyword) {
            let closest = matches.reduce((best, mp) => {
                if (!isStandalone(cleanMsg, mp.value, mp.index)) return best;
                if (isPartOfDate(cleanMsg, mp.value, mp.index)) return best;
                let dist = Math.abs(mp.index - keywordIndex);
                if (dist > 120) return best;
                return !best || dist < best.dist ? { value: mp.value, dist } : best;
            }, null);
            if (closest) return closest.value;
            else return 'nan'
        }
        else {
            for (let i = 0; i < matches.length; i++) {
                if (
                    isStandalone(cleanMsg, matches[i].value, matches[i].index) &&
                    !hasNegativeKeywordBefore(cleanMsg, matches[i].index) &&
                    !isPartOfDate(cleanMsg, matches[i].value, matches[i].index) &&
                    !haslongNegativeKeyword(cleanMsg, matches[i].value, matches[i].index)
                ) {
                    return matches[i].value;
                }
            }

        }
        return 'nan';
    }
}


module.exports = Child;
