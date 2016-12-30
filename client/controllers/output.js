angular.module('mecab-translate')
.controller('Output', function($scope, $rootScope, Mecab, JMdict_e, Kanjidic2, SimilarKanji, KanjiVG, ResponsiveVoice, RemoteTts, Tts, TtsEvents, EventBridge, Config, Helpers) {

    $scope.posClass = Helpers.posClass;

    Config.listen('show-mecab-info', function(val) {
        $scope.showMecabInfo = val;
    });

    var nonclick;
    Config.listen('non-click-mode', function(val) {
        nonclick = val;
        $scope.nonclick = val;
    });

    $rootScope.$on('toggle-non-click-mode', function() {
        Config.set('non-click-mode', !nonclick);
    });

    $scope.disableNonClickMode = function() {
        Config.set('non-click-mode', false);
    }

    $rootScope.$on('shift-down', function() {
        $scope.nonclick = !nonclick;
        if (kanjiInfoQueue)
            $scope.getKanjiInfo(kanjiInfoQueue);
        if (wordInfoQueue)
            $scope.showWordInfo(wordInfoQueue);
    });

    $rootScope.$on('shift-up', function() {
        $scope.nonclick = nonclick;
    });

    Mecab.setOutput(function(output) {
        $scope.lines = output;
    });

    $scope.clearKanjiInfoQueue = function() {
        kanjiInfoQueue = null;
    }
    var kanjiInfoQueue;
    var kanjiInfoTimer;
    $scope.getKanjiInfo = function(kanji, mouseover) {
        if (mouseover) {
            if (!Helpers.isKanji(kanji))
                return;
            kanjiInfoQueue = kanji;
            if (!$scope.nonclick)
                return;
            if (kanjiInfoTimer) {
                clearTimeout(kanjiInfoTimer);
            }
            kanjiInfoTimer = setTimeout(function() {
                if (kanjiInfoQueue) {
                    $scope.getKanjiInfo(kanjiInfoQueue);
                }
            }, 100);
        } else {
            KanjiVG.get(kanji);
            Kanjidic2.get(kanji);
            SimilarKanji.get(kanji);
        }
    }

    $scope.clearWordInfoQueue = function() {
        wordInfoQueue = null;
    }
    var wordInfoQueue;
    var wordInfoTimer;
    $scope.showWordInfo = function(word, mouseover) {
        if (mouseover) {
            wordInfoQueue = word;
            if (!$scope.nonclick)
                return;
            if (wordInfoTimer) {
                clearTimeout(wordInfoTimer);
            }
            wordInfoTimer = setTimeout(function() {
                if (wordInfoQueue) {
                    $scope.showWordInfo(wordInfoQueue);
                }
            }, 100);
        } else if (!window.getSelection().toString()) {
            $scope.word = word;
            JMdict_e.translate(word, true);
        }
    }

    $scope.translateSelection = function() {
        var selection = window.getSelection().toString();
        if ($scope.lastSelection == selection)
            return;
        else
            $scope.lastSelection = selection;
        if (selection) {
            JMdict_e.translate(selection);
            $scope.TTS(selection);
        }
    }

    $scope.updateWordLookup = function() {
        var selection = window.getSelection().toString();
        if (selection)
            EventBridge.dispatch('text-selected', selection);
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
