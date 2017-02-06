angular.module('mecab-translate')
.controller('Output', function($scope, $rootScope, Mecab, JMdict_e, Kanjidic2, SimilarKanji, KanjiVG, ResponsiveVoice, RemoteTts, Tts, TtsEvents, EventBridge, Config, Helpers) {

    $scope.posClass = Helpers.posClass;
    $scope.mecabInfoTranslation = Helpers.mecabInfoTranslation;

    Config.listen('output-font-size', function(val) {
        $scope.outputFontSize = val;
    });

    Config.listen('output-max-height', function(val) {
        $scope.outputMaxHeight = val ? val + 'px' : 'none';
    });

    Config.listen('show-mecab-info', function(val) {
        $scope.showMecabInfo = val;
    });

    Config.listen('context-based-search', function(val) {
        $scope.contextBasedSearch = val;
    });

    Config.listen('output-line-max-length', function(val) {
        $scope.outputLineMaxLength = val;
        if ($scope.lines) {
            var lines = [[].concat.apply([], $scope.lines)];
            if (val > 0) {
                lines = processMecabLines(lines);
            }
            $scope.lines = lines;
        }
    });

    var nonclick;
    Config.listen('non-click-mode', function(val) {
        nonclick = val;
        $scope.nonclick = val;
    });

    $rootScope.$on('toggle-non-click-mode', function() {
        Config.set('non-click-mode', !nonclick);
    });

    $scope.pauseNonClickMode = function(word) {
        $scope.nonclick = false;
        if (word) {
            word.tooltip = false;
        }
    }

    $scope.resumeNonClickMode = function() {
        $scope.nonclick = nonclick;
    }

    function processMecabLines(lines) {
        lines = lines || [];

        var processedLines = [];
        var lineLength, punctuationIndex, particleIndex, lineOffset, delimiter;
        for (var i = 0; i < lines.length; i++) {
            punctuationIndex = -1;
            particleIndex = -1;
            lineOffset = 0;
            lineLength = 0;
            for (var j = 0; j < lines[i].length; j++) {
                if (lines[i][j].literal === undefined) {
                    continue;
                }
                delimiter = false;
                lineLength += lines[i][j].literal.length;
                if (Helpers.isPunctuation(lines[i][j].literal)) {
                    punctuationIndex = j;
                    if (punctuationIndex > particleIndex) {
                        particleIndex = -1;
                    }
                    delimiter = true;
                } else if (['が','の','を','に','へ','と','か','や','な','わ','よ','ね'].indexOf(lines[i][j].literal) != -1) {
                    particleIndex = j;
                    delimiter = true;
                }
                if (!delimiter && lineLength > $scope.outputLineMaxLength) {
                    if (punctuationIndex == -1) {
                        if (particleIndex == -1) {
                            processedLines.push(lines[i].slice(lineOffset, j));
                            lineOffset = j;
                        } else {
                            processedLines.push(lines[i].slice(lineOffset, particleIndex + 1));
                            lineOffset = particleIndex + 1;
                            particleIndex = -1;
                        }
                    } else {
                        processedLines.push(lines[i].slice(lineOffset, punctuationIndex + 1));
                        lineOffset = punctuationIndex + 1;
                        punctuationIndex = -1;
                    }
                    lineLength = lines[i].slice(lineOffset, j).map(function(a, b) {
                        return a.literal;
                    }).join('').length;
                }
            }
            processedLines.push(lines[i].slice(lineOffset));
        }
        return processedLines;
    }

    $scope.setLines = function(lines) {
        if ($scope.outputLineMaxLength > 0) {
            $scope.lines = processMecabLines(lines);
        } else {
            $scope.lines = lines;
        }
    }

    EventBridge.addEventListener('mecab-response', function(output) {
        $scope.allLines = output;
        $scope.setLines(output);
    });

    EventBridge.addEventListener('mecab-nbest', function(output) {
        $scope.nbest = output;
    });

    $scope.clearNbest = function() {
        $scope.nbest = null;
        $scope.showNbest = false;
        $scope.setLines($scope.allLines);
    }

    $scope.toggleNbest = function() {
        $scope.showNbest = !$scope.showNbest;
    }

    $scope.showTooltip = function(word, event) {
        if (!word.tooltip && $scope.nonclick) {
            var bodyRect = document.body.getBoundingClientRect();
            var element = event.target.classList.contains('word') ? event.target : event.target.parentElement;
            var rect = element.getBoundingClientRect();
            word.right = rect.width + (bodyRect.right - rect.right);
            word.width = Math.min(Math.max(300, bodyRect.width / 2), bodyRect.width * 0.95);
            word.tooltip = true;
        }
    }

    $scope.hideTooltip = function(word) {
        if ($scope.nonclick) {
            word.tooltip = false;
        }
    }

    EventBridge.addEventListener('kanjidic2-tooltip', function(response) {
        $scope.kanjidicInfo = response;
    });

    $scope.clearKanjiInfoQueue = function() {
        kanjiInfoQueue = null;
    }
    var kanjiInfoQueue;
    var kanjiInfoTimer;
    $scope.getKanjiInfo = function(kanji, mouseover, tooltip) {
        if (mouseover) {
            $scope.kanjidicInfo = {};
            kanjiInfoQueue = kanji;
            if (!$scope.nonclick)
                return;
            if (kanjiInfoTimer) {
                clearTimeout(kanjiInfoTimer);
            }
            kanjiInfoTimer = setTimeout(function() {
                if (kanjiInfoQueue) {
                    $scope.getKanjiInfo(kanjiInfoQueue, false, true);
                }
            }, 100);
        } else {
            if (!tooltip) {
                KanjiVG.get(kanji);
                SimilarKanji.get(kanji);
            }
            Kanjidic2.get(kanji, null, tooltip);
        }
    }

    EventBridge.addEventListener('jmdict-tooltip', function(output) {
        $scope.jmdictEntries = output.exact || [];
    });

    $scope.clearWordInfoQueue = function() {
        wordInfoQueue = null;
    }
    var wordInfoQueue;
    var wordInfoTimer;
    $scope.showWordInfo = function(word, mouseover, position, tooltip) {
        if (mouseover) {
            $scope.jmdictEntries = [];
            wordInfoQueue = word;
            if (!$scope.nonclick)
                return;
            if (wordInfoTimer) {
                clearTimeout(wordInfoTimer);
            }
            wordInfoTimer = setTimeout(function() {
                if (wordInfoQueue) {
                    $scope.showWordInfo(wordInfoQueue, false, position, true);
                }
            }, 100);
        } else if (!window.getSelection().toString()) {
            if (!tooltip) {
                $scope.word = word;
            }
            JMdict_e.translate(word, true, false, position && $scope.contextBasedSearch
                ? {lines: $scope.lines, pos: position} : null, tooltip);
        }
    }

    $scope.translateSelection = function() {
        var selection = window.getSelection();
        var text = selection.toString().replace(/[\r\n]/g, '');
        if (text) {
            EventBridge.dispatch('text-selected', text);
            $scope.resumeNonClickMode();
            JMdict_e.translate(text);
            $scope.lastSelection = text;
            Mecab.analyze(text, null, 10);
            $scope.TTS(text);
        }
    }

    $scope.TTS = function(text, line) {
        if (line) {
            text = text.map(function(w) {
                return w.literal;
            }).join('');
        } else {
            $scope.ttsRow = -1;
        }
        if (Config.get('tts-provider') == 'responsivevoice') {
            ResponsiveVoice.TTS(text);
        } else if (Config.get('tts-provider').startsWith('tts')) {
            Tts.TTS(text);
        } else if (Config.get('tts-provider') == 'remotetts') {
            RemoteTts.TTS(text);
        }
    }

    $scope.updateRow = function(row) {
        $scope.ttsRow = row;
    }

    $scope.ttsRow = -1;

    $scope.ttsPos = {row: -1, char_pos: -1, length: -1};

    TtsEvents.setOutput(function(e) {
        if ($scope.ttsRow == -1)
            return;
        var row;
        if ($scope.ttsPos.char_pos != -1) {
            row = document.querySelectorAll('.row-'+$scope.ttsPos.row+' .character');
            for (var i = $scope.ttsPos.char_pos; i < $scope.ttsPos.char_pos + $scope.ttsPos.length; i++) {
                try {
                    row[i].style.backgroundColor = '';
                } catch (e) {};
            }
        }

        var ev = JSON.parse(e.data);

        if (ev.type == 'word') {
            $scope.ttsPos.row = $scope.ttsRow;
            $scope.ttsPos.char_pos = ev.char_pos;
            $scope.ttsPos.length = ev.length;
            row = document.querySelectorAll('.row-'+$scope.ttsPos.row+' .character');
            for (var i = $scope.ttsPos.char_pos; i < $scope.ttsPos.char_pos + $scope.ttsPos.length; i++) {
                try {
                    row[i].style.backgroundColor = '#bbb';
                } catch (e) {};
            }
        }

    });

});
