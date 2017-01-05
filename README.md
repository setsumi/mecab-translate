# mecab-translate

Make sense of Japanese text with minimal effort and learn kanji in the process. Uses MeCab to break the input to words, allowing their dictionary form to be looked up from JMDict. Kanji information is provided by KANJIDIC2 and KanjiVG. Text-to-speech is also available.

NOTE: This is a third party bundle intended for use on Windows. Original program is [here](https://github.com/siikamiika/mecab-translate). 

## Installation

* Download this package (press `Clone or download` then `Download ZIP` buttons) and extract.
* Go into `unidic-mecab` subfolder and extract `mecab-dic.rar` right there.
* Install [Python](https://www.python.org/downloads/) 2 or 3. Make sure to enable `Register Extensions` and `Add python.exe to Path` options during installation.
* Open system command prompt (cmd.exe) and run the command:

    `pip install --upgrade pypiwin32 tornado pyperclip`
* Go into the mecab-translate folder and run `download_dependencies.py`
* Done.

## Running

* Run `server.py` and wait untill it says "server listening to :9874".
* If clipboard tracking is needed, run `clipboard_server.py`
* Open web browser at address `http://localhost:9874/`
* Use cog-wheel icon at the top left to access the settings menu.
* Type `localhost:9873` in the "WebSocket input" field. Message "Connected" shoud be displayed in green.
* That's it.

## Use

Ready to use with ITH out of the box.
Any text copied to the clipboard should appear in the textarea at http://localhost:9874.
If the clipboard changes, the new text will replace the old one. However, the history can be 
navigated with the buttons below the textarea or with the hotkeys Alt+1 (back) and Alt+2 (forward).
The input can be edited, for example when you want to partition the text to understand it better.
copy_clipboard_pythonX.py tries to add newlines after logical pauses such as 。　and 、 though.

### TTS

The dropdown menu under the navigation keys is used to select a text-to-speech provider. I think 
that text-to-speech is very important in understanding unvoiced parts. I suggest installing 
VW Misaki from the "link" in optional dependencies because it enables highlighting the part of the 
text that is being read aloud. ResponsiveVoice is nice as well and sometimes more accurate with 
pronunciation but it requires an internet connection and it can be shut down whenever they decide
to do so.

### Output

Output automatically updates to what there is in the textarea (input field). Parts of speech will be 
highlighted with their own colors a lot like TA. The part of speech in question can be verified by 
hovering the mouse over a word.

Clicking a word will do a few things. Firstly, the character (kanji) that was under the cursor will 
be opened for closer inspection under the output. Secondly, the word's lemma (dictionary form) will 
be queried from jpn-eng dictionary (JMdict) and displayed under the character information field. 
Last but not least, there will be a small line of information about the word that was clicked. It 
is output from mecab, the program that parses the input and decides which groups of characters are 
words and what their dictionary form is. mecab-translate makes use of it by coloring parts of speech 
but if you want to get grammar-nerdy, there is also information about the inflection form and more 
accurate information about the part of speech of the word.

Left of each line of output is a button that reads the current line with the selected text-to-speech 
engine.

MeCab is not perfect, and sometimes it incorrectly breaks text into words where it shouldn't. In 
these cases, text selection may come in handy. Selecting text does two things. It queries JMdict 
WITHOUT using the dictionary forms that mecab has parsed and reads the text aloud using the selected
text-to-speech engine.
Example use cases: input text is 中出し. Mecab says that there are two words:
中: inside, and
出し (dictionary form: 出す): something about going out
This is not very useful unless you know what their meaning is together. Selecting both of the words 
with mouse will reveal the truth.

Selecting text can also be used with mecab output information field to translate the information.

Sometimes it's better to leave the tail of the word out when selecting text. If exact results are 
not found (or even when they are), the results starting with the query will be available at the 
bottom of the translations from a button that reads 
"More words starting with [the query] \(number of results)".

### Kanji information

Yes, this feature is ripped straight off Tagaini Jisho. The only difference is that mecab-translate 
tries to be smarter with kanji part based kanji lookup.

When the kanji information field updates, you will see an SVG image that has its components highlighted 
with different colors. Next to the image there are the kanji's details. The interesting piece of 
information is the "Freq" value of a kanji. It basically tells you how common a kanji is. Given that 
Jōyō kanji consist of a bit over 2000 characters, you know when you are dealing with a rare character 
when the Freq value is approaching 2000 or when it doesn't exist at all (which means that it would be 
over 2500).

This frequency value also tightly relates to the kanji part lookup. The results of the kanji part 
lookup are sorted by their frequency and when approacing more common kanji they are colored increasingly 
red and their font size also slightly increases. Clicking a result will do what you expect. At first 
results are looked up for kanji that have the current kanji as their component. When the checkboxes next 
to the current kanji's components are clicked, the results will be kanji that also consist of the 
components. Selecting every single checkbox should usually give only one result (which is the current 
kanji of course).

It might be confusing, but hovering mouse over a kanji's component sometimes displays information 
different from what you will see after clicking the component. This is because the kanji components 
have variants that sometimes lack useful information about the component's meaning. An example is 
脳 (brain) where 月 (moon) actually means 肉 (meat). See what I mean? It's not "evil moon" but rather 
"evil meat". 月 is just easier to draw and it looks similar.

### Translations

This field updates every time a word is clicked, text is selected outside itself, a cross reference or 
one of the "more words starting with ..." results is clicked. The results are pretty straightforward. 
A few things worth noting are that "common" words and readings are highlighted red, more information 
about abbreviations can be obtained by hovering an abbreviation that has a small superscript question 
mark above it, and that the translations are sorted in an order that depends on multiple things.

The sorting hierarchy is as follows:
The most important criterion to appear at top is that mecab's "understanding" of the word's reading 
is included in the word's readings.
If two words both have the required reading, next comes the part of speech. mecab-translate knows 
that 助動詞 means aux-v and sorts the past-indicating auxiliary verb た before other results for た 
because none of the others have the part of speech marker aux-v.
If even the part of speech matches, next comes the red highlight, frequency. Common words are sorted 
before not-as-common (black). Less common words can, however, appear before common words when their 
other more important properties match the query.

If you suspect that mecab has incorrectly detected the word's lemma and the correct word is the result's 
homonym (a word sounding the same but with different meaning) you can click a translation result's  
reading to query the dictionary for all results matching the reading rather than the word. Sorting will 
fall back to by-frequency only.

In the same manner, you can look up kanji by clicking the kanji in a word from the results. It doesn't 
work on kanji in the explanations for translations, though.

mecab-translate also has the feature from jisho.org that displays examples for translations next to them. 
They can be opened by clicking the [example] button and closed from the same button.