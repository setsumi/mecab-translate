# -*- coding: utf-8 -*-
import pyperclip
from tornado import websocket, web, ioloop
import time
from threading import Thread
import re

clients = []

class WsHandler(websocket.WebSocketHandler):

    def check_origin(self, origin):
        return True

    def open(self):
        if self not in clients:
            clients.append(self)

    def on_close(self):
        if self in clients:
            clients.remove(self)


def get_app():
    return web.Application([
        (r'/', WsHandler),
    ])



def main():

    global old
    old = ''

    def check():
        global old
        text = pyperclip.paste()
        if not text or text == old:
            return
        for c in clients:
            c.write_message(text)
        old = text

    def watchdog():
        while True:
            check()
            time.sleep(0.2)

    Thread(target=watchdog).start()

    app = get_app()
    app.listen(9873)
    main_loop = ioloop.IOLoop.instance()
    print('clipboard sender for mecab-translate\n')
    print('websocket listening to :9873')
    print('input this host and port to \'WebSocket input\' field in config menu!')
    main_loop.start()
    

if __name__ == '__main__':
    main()
