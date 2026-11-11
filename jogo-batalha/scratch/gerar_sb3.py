#!/usr/bin/env python3
"""Gera o projeto Scratch 3 (.sb3) do jogo "A Noite dos Objetos".

Uso:  python3 gerar_sb3.py  [saida.sb3]

O projeto inteiro (blocos, fantasias em SVG e sons em WAV) e montado aqui,
sem depender de nenhuma biblioteca externa.
"""
import hashlib
import io
import json
import math
import os
import struct
import sys
import zipfile

# =====================================================================
# FONTE EM PIXELS (5x7, com 2 linhas para acentos e 1 para cedilha)
# =====================================================================
BASE = {
 'A': ".###.|#...#|#...#|#####|#...#|#...#|#...#",
 'B': "####.|#...#|#...#|####.|#...#|#...#|####.",
 'C': ".###.|#...#|#....|#....|#....|#...#|.###.",
 'D': "####.|#...#|#...#|#...#|#...#|#...#|####.",
 'E': "#####|#....|#....|####.|#....|#....|#####",
 'F': "#####|#....|#....|####.|#....|#....|#....",
 'G': ".###.|#...#|#....|#.###|#...#|#...#|.####",
 'H': "#...#|#...#|#...#|#####|#...#|#...#|#...#",
 'I': ".###.|..#..|..#..|..#..|..#..|..#..|.###.",
 'J': "..###|...#.|...#.|...#.|#..#.|#..#.|.##..",
 'K': "#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#",
 'L': "#....|#....|#....|#....|#....|#....|#####",
 'M': "#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#",
 'N': "#...#|#...#|##..#|#.#.#|#..##|#...#|#...#",
 'O': ".###.|#...#|#...#|#...#|#...#|#...#|.###.",
 'P': "####.|#...#|#...#|####.|#....|#....|#....",
 'Q': ".###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#",
 'R': "####.|#...#|#...#|####.|#.#..|#..#.|#...#",
 'S': ".####|#....|#....|.###.|....#|....#|####.",
 'T': "#####|..#..|..#..|..#..|..#..|..#..|..#..",
 'U': "#...#|#...#|#...#|#...#|#...#|#...#|.###.",
 'V': "#...#|#...#|#...#|#...#|#...#|.#.#.|..#..",
 'W': "#...#|#...#|#...#|#.#.#|#.#.#|#.#.#|.#.#.",
 'X': "#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#",
 'Y': "#...#|#...#|.#.#.|..#..|..#..|..#..|..#..",
 'Z': "#####|....#|...#.|..#..|.#...|#....|#####",
 '0': ".###.|#...#|#..##|#.#.#|##..#|#...#|.###.",
 '1': "..#..|.##..|..#..|..#..|..#..|..#..|.###.",
 '2': ".###.|#...#|....#|...#.|..#..|.#...|#####",
 '3': "#####|...#.|..#..|...#.|....#|#...#|.###.",
 '4': "...#.|..##.|.#.#.|#..#.|#####|...#.|...#.",
 '5': "#####|#....|####.|....#|....#|#...#|.###.",
 '6': "..##.|.#...|#....|####.|#...#|#...#|.###.",
 '7': "#####|....#|...#.|..#..|.#...|.#...|.#...",
 '8': ".###.|#...#|#...#|.###.|#...#|#...#|.###.",
 '9': ".###.|#...#|#...#|.####|....#|...#.|.##..",
 '.': ".....|.....|.....|.....|.....|.##..|.##..",
 ',': ".....|.....|.....|.....|.##..|..#..|.#...",
 '!': "..#..|..#..|..#..|..#..|..#..|.....|..#..",
 '?': ".###.|#...#|....#|...#.|..#..|.....|..#..",
 ':': ".....|.##..|.##..|.....|.##..|.##..|.....",
 ';': ".....|.##..|.##..|.....|.##..|..#..|.#...",
 '-': ".....|.....|.....|#####|.....|.....|.....",
 '+': ".....|..#..|..#..|#####|..#..|..#..|.....",
 '%': "##...|##..#|...#.|..#..|.#...|#..##|...##",
 "'": "..#..|..#..|.#...|.....|.....|.....|.....",
 '"': ".#.#.|.#.#.|.#.#.|.....|.....|.....|.....",
 '*': ".....|..#..|#.#.#|.###.|#.#.#|..#..|.....",
 '/': "....#|...#.|...#.|..#..|.#...|.#...|#....",
 '(': "...#.|..#..|.#...|.#...|.#...|..#..|...#.",
 ')': ".#...|..#..|...#.|...#.|...#.|..#..|.#...",
 '=': ".....|.....|#####|.....|#####|.....|.....",
 '>': ".#...|..#..|...#.|....#|...#.|..#..|.#...",
 '<': "...#.|..#..|.#...|#....|.#...|..#..|...#.",
 '▼': ".....|.....|#####|.###.|..#..|.....|.....",
 '♥': ".....|.#.#.|#####|#####|.###.|..#..|.....",
 '★': "..#..|..#..|#####|.###.|.#.#.|#...#|.....",
}
ACC = {
 'agudo': ["...#.", "..#.."], 'grave': [".#...", "..#.."], 'circ': ["..#..", ".#.#."],
 'til': [".##.#", "#.##."], 'trema': [".....", ".#.#."],
}
ACENTUADAS = {
 'Á': ('A', 'agudo'), 'À': ('A', 'grave'), 'Â': ('A', 'circ'), 'Ã': ('A', 'til'),
 'É': ('E', 'agudo'), 'Ê': ('E', 'circ'), 'Í': ('I', 'agudo'), 'Ó': ('O', 'agudo'),
 'Ô': ('O', 'circ'), 'Õ': ('O', 'til'), 'Ú': ('U', 'agudo'), 'Ü': ('U', 'trema'),
}


def glyph_rows(ch):
    blank = "....."
    if ch in ACENTUADAS:
        b, a = ACENTUADAS[ch]
        return ACC[a] + BASE[b].split('|') + [blank]
    if ch == 'Ç':
        return [blank, blank] + BASE['C'].split('|') + ["..##."]
    return [blank, blank] + BASE[ch].split('|') + [blank]


FONT_CHARS = list(BASE.keys()) + list(ACENTUADAS.keys()) + ['Ç']
SUPPORTED = set(FONT_CHARS) | {' ', '|'}

# =====================================================================
# ASSETS
# =====================================================================
ASSETS = {}


def svg_doc(w, h, body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">'
            f'<rect x="0" y="0" width="{w}" height="{h}" fill="#000000" fill-opacity="0"/>{body}</svg>')


def costume(name, svg, cx, cy):
    data = svg.encode('utf-8')
    md5 = hashlib.md5(data).hexdigest()
    ASSETS[md5 + '.svg'] = data
    return {'name': name, 'bitmapResolution': 1, 'dataFormat': 'svg', 'assetId': md5,
            'md5ext': md5 + '.svg', 'rotationCenterX': cx, 'rotationCenterY': cy}


def glyph_svg(rows):
    rects = []
    for r, row in enumerate(rows):
        c = 0
        while c < 5:
            if row[c] == '#':
                s = c
                while c < 5 and row[c] == '#':
                    c += 1
                rects.append(f'<rect x="{s * 2}" y="{r * 2}" width="{(c - s) * 2}" height="2"/>')
            else:
                c += 1
    return svg_doc(10, 20, '<g fill="#ff0000">' + ''.join(rects) + '</g>')


def wav(name, segs, rate=22050):
    """segs: lista de (freq_ini, freq_fim, dur, forma, volume)."""
    out = []
    for f0, f1, dur, shape, vol in segs:
        n = int(rate * dur)
        ph = 0.0
        for i in range(n):
            k = i / max(1, n - 1)
            f = f0 * (f1 / f0) ** k if f0 > 0 and f1 > 0 else f0
            ph += f / rate
            p = ph % 1.0
            if shape == 'sq':
                s = 1.0 if p < 0.5 else -1.0
            elif shape == 'tri':
                s = 4 * abs(p - 0.5) - 1
            else:
                s = 2 * p - 1
            env = (1 - k) ** 1.5
            out.append(int(max(-1, min(1, s * vol * env)) * 32767))
    pcm = b''.join(struct.pack('<h', v) for v in out)
    hdr = b'RIFF' + struct.pack('<I', 36 + len(pcm)) + b'WAVEfmt ' + struct.pack('<IHHIIHH', 16, 1, 1, rate, rate * 2, 2, 16) + b'data' + struct.pack('<I', len(pcm))
    data = hdr + pcm
    md5 = hashlib.md5(data).hexdigest()
    ASSETS[md5 + '.wav'] = data
    return {'name': name, 'assetId': md5, 'dataFormat': 'wav', 'format': '', 'rate': rate,
            'sampleCount': len(out), 'md5ext': md5 + '.wav'}


# =====================================================================
# MINI-LINGUAGEM PARA GERAR BLOCOS
# =====================================================================
class E:
    pass


class V(E):
    def __init__(self, name): self.name = name


class Arg(E):
    def __init__(self, name): self.name = name


class Blk(E):
    def __init__(self, op, inputs=None, fields=None, mutation=None, proc=None):
        self.op, self.inputs, self.fields, self.mutation, self.proc = op, inputs or {}, fields or {}, mutation, proc


SPEC = {
 'motion_gotoxy': {'X': 'num', 'Y': 'num'}, 'motion_setx': {'X': 'num'}, 'motion_sety': {'Y': 'num'},
 'motion_changexby': {'DX': 'num'}, 'motion_changeyby': {'DY': 'num'}, 'motion_movesteps': {'STEPS': 'num'},
 'motion_turnright': {'DEGREES': 'num'}, 'motion_pointindirection': {'DIRECTION': 'angle'},
 'motion_pointtowards': {'TOWARDS': 'menu:motion_pointtowards_menu:TOWARDS'},
 'looks_switchcostumeto': {'COSTUME': 'menu:looks_costume:COSTUME'},
 'looks_seteffectto': {'VALUE': 'num'}, 'looks_changeeffectby': {'CHANGE': 'num'},
 'looks_setsizeto': {'SIZE': 'num'}, 'looks_say': {'MESSAGE': 'text'},
 'sound_play': {'SOUND_MENU': 'menu:sound_sounds_menu:SOUND_MENU'},
 'event_broadcast': {'BROADCAST_INPUT': 'bcast'},
 'control_repeat': {'TIMES': 'whole', 'SUBSTACK': 'stack'}, 'control_forever': {'SUBSTACK': 'stack'},
 'control_if': {'CONDITION': 'bool', 'SUBSTACK': 'stack'},
 'control_if_else': {'CONDITION': 'bool', 'SUBSTACK': 'stack', 'SUBSTACK2': 'stack'},
 'control_repeat_until': {'CONDITION': 'bool', 'SUBSTACK': 'stack'},
 'control_create_clone_of': {'CLONE_OPTION': 'menu:control_create_clone_of_menu:CLONE_OPTION'},
 'sensing_keypressed': {'KEY_OPTION': 'menu:sensing_keyoptions:KEY_OPTION'},
 'sensing_touchingobject': {'TOUCHINGOBJECTMENU': 'menu:sensing_touchingobjectmenu:TOUCHINGOBJECTMENU'},
 'sensing_distanceto': {'DISTANCETOMENU': 'menu:sensing_distancetomenu:DISTANCETOMENU'},
 'operator_add': {'NUM1': 'num', 'NUM2': 'num'}, 'operator_subtract': {'NUM1': 'num', 'NUM2': 'num'},
 'operator_multiply': {'NUM1': 'num', 'NUM2': 'num'}, 'operator_divide': {'NUM1': 'num', 'NUM2': 'num'},
 'operator_mod': {'NUM1': 'num', 'NUM2': 'num'}, 'operator_random': {'FROM': 'num', 'TO': 'num'},
 'operator_lt': {'OPERAND1': 'text', 'OPERAND2': 'text'}, 'operator_gt': {'OPERAND1': 'text', 'OPERAND2': 'text'},
 'operator_equals': {'OPERAND1': 'text', 'OPERAND2': 'text'},
 'operator_and': {'OPERAND1': 'bool', 'OPERAND2': 'bool'}, 'operator_or': {'OPERAND1': 'bool', 'OPERAND2': 'bool'},
 'operator_not': {'OPERAND': 'bool'}, 'operator_join': {'STRING1': 'text', 'STRING2': 'text'},
 'operator_letter_of': {'LETTER': 'whole', 'STRING': 'text'}, 'operator_length': {'STRING': 'text'},
 'operator_round': {'NUM': 'num'}, 'operator_mathop': {'NUM': 'num'},
 'data_setvariableto': {'VALUE': 'text'}, 'data_changevariableby': {'VALUE': 'num'},
 'data_addtolist': {'ITEM': 'text'}, 'data_deleteoflist': {'INDEX': 'int'},
 'data_itemoflist': {'INDEX': 'int'}, 'data_replaceitemoflist': {'INDEX': 'int', 'ITEM': 'text'},
 'pen_setPenColorToColor': {'COLOR': 'color'}, 'pen_setPenSizeTo': {'SIZE': 'num'},
}
PRIM = {'num': 4, 'pos': 5, 'whole': 6, 'int': 7, 'angle': 8, 'color': 9, 'text': 10}
MENU_DEFAULT = {'motion_pointtowards_menu': '_mouse_', 'looks_costume': 'vazio', 'sound_sounds_menu': '',
                'control_create_clone_of_menu': '_myself_', 'sensing_keyoptions': 'space',
                'sensing_touchingobjectmenu': '_mouse_', 'sensing_distancetomenu': '_mouse_'}

_nid = [0]


def nid():
    _nid[0] += 1
    return 'id%05d' % _nid[0]


def fmt(v):
    if isinstance(v, float):
        if v == int(v):
            return str(int(v))
        return repr(round(v, 4))
    return str(v)


class Project:
    def __init__(self):
        self.globals = {}
        self.glists = {}
        self.bcasts = {}

    def bcast(self, name):
        if name not in self.bcasts:
            self.bcasts[name] = 'bc_' + name
        return self.bcasts[name]


class Target:
    def __init__(self, proj, name, stage=False):
        self.proj, self.name, self.stage = proj, name, stage
        self.blocks, self.vars, self.lists, self.procs = {}, {}, {}, {}
        self.costumes, self.sounds = [], []
        self.sy = 0

    def var(self, name, val=0):
        self.vars[name] = ('v_%s_%s' % (self.name, name), val)

    def lst(self, name, val=None):
        self.lists[name] = ('l_%s_%s' % (self.name, name), list(val or []))

    def var_id(self, name):
        if name in self.vars:
            return self.vars[name][0]
        if name in self.proj.globals:
            return self.proj.globals[name][0]
        raise KeyError('variavel desconhecida: ' + name + ' em ' + self.name)

    def list_id(self, name):
        if name in self.lists:
            return self.lists[name][0]
        if name in self.proj.glists:
            return self.proj.glists[name][0]
        raise KeyError('lista desconhecida: ' + name)

    # ---- emissao ----
    def emit(self, b, parent, shadow=False, top=False):
        bid = nid()
        if isinstance(b, Arg):
            self.blocks[bid] = {'opcode': 'argument_reporter_string_number', 'next': None, 'parent': parent,
                                'inputs': {}, 'fields': {'VALUE': [b.name, None]}, 'shadow': False, 'topLevel': False}
            return bid
        if isinstance(b, V):
            # variavel como bloco solto (usada so como reporter em menus)
            self.blocks[bid] = {'opcode': 'data_variable', 'next': None, 'parent': parent, 'inputs': {},
                                'fields': {'VARIABLE': [b.name, self.var_id(b.name)]}, 'shadow': False, 'topLevel': False}
            return bid
        d = {'opcode': b.op, 'next': None, 'parent': parent, 'inputs': {}, 'fields': {}, 'shadow': shadow, 'topLevel': top}
        self.blocks[bid] = d
        if b.op == 'procedures_call':
            proccode, argids, params = self.procs[b.proc]
            d['mutation'] = {'tagName': 'mutation', 'children': [], 'proccode': proccode,
                             'argumentids': json.dumps(argids), 'warp': 'true'}
            for aid, val in zip(argids, b.inputs['args']):
                d['inputs'][aid] = self.enc('text', val, bid)
            return bid
        spec = SPEC.get(b.op, {})
        for k, v in b.inputs.items():
            if v is None:
                continue
            enc = self.enc(spec[k], v, bid)
            if enc is not None:
                d['inputs'][k] = enc
        for k, v in b.fields.items():
            if k == 'VARIABLE':
                d['fields'][k] = [v, self.var_id(v)]
            elif k == 'LIST':
                d['fields'][k] = [v, self.list_id(v)]
            elif k == 'BROADCAST_OPTION':
                d['fields'][k] = [v, self.proj.bcast(v)]
            else:
                d['fields'][k] = [v, None]
        if b.mutation:
            d['mutation'] = b.mutation
        return bid

    def enc(self, kind, v, parent):
        if kind in PRIM:
            code = PRIM[kind]
            if isinstance(v, (int, float, str)) and not isinstance(v, bool):
                return [1, [code, fmt(v)]]
            empty = '#000000' if kind == 'color' else ''
            if isinstance(v, V):
                return [3, [12, v.name, self.var_id(v.name)], [code, empty]]
            rid = self.emit(v, parent)
            return [3, rid, [code, empty]]
        if kind == 'bool':
            return [2, self.emit(v, parent)]
        if kind == 'stack':
            first = self.seq(v, parent)
            return [2, first] if first else None
        if kind == 'bcast':
            return [1, [11, v, self.proj.bcast(v)]]
        if kind.startswith('menu:'):
            _, mop, field = kind.split(':')
            sid = nid()
            lit = v if isinstance(v, str) else MENU_DEFAULT[mop]
            self.blocks[sid] = {'opcode': mop, 'next': None, 'parent': parent, 'inputs': {},
                                'fields': {field: [lit, None]}, 'shadow': True, 'topLevel': False}
            if isinstance(v, str):
                return [1, sid]
            rid = self.emit(v, parent)
            return [3, rid, sid]
        raise ValueError(kind)

    def seq(self, stmts, parent):
        flat = []

        def fl(x):
            for s in x:
                if isinstance(s, (list, tuple)):
                    fl(s)
                elif s is not None:
                    flat.append(s)
        fl(stmts)
        prev = first = None
        for s in flat:
            bid = self.emit(s, prev or parent)
            if prev:
                self.blocks[prev]['next'] = bid
            else:
                first = bid
            prev = bid
        return first

    def script(self, hat, body):
        hid = self.emit(hat, None, top=True)
        self.blocks[hid]['x'] = 0
        self.blocks[hid]['y'] = self.sy
        self.sy += 400
        first = self.seq(body, hid)
        self.blocks[hid]['next'] = first

    def declare(self, name, params):
        proccode = name + ''.join(' %s' for _ in params)
        self.procs[name] = (proccode, [nid() for _ in params], params)

    def define(self, name, body):
        proccode, argids, params = self.procs[name]
        did, pid = nid(), nid()
        inputs = {}
        for aid, pname in zip(argids, params):
            rid = nid()
            self.blocks[rid] = {'opcode': 'argument_reporter_string_number', 'next': None, 'parent': pid,
                                'inputs': {}, 'fields': {'VALUE': [pname, None]}, 'shadow': True, 'topLevel': False}
            inputs[aid] = [1, rid]
        self.blocks[did] = {'opcode': 'procedures_definition', 'next': None, 'parent': None,
                            'inputs': {'custom_block': [1, pid]}, 'fields': {}, 'shadow': False,
                            'topLevel': True, 'x': 900, 'y': self.sy}
        self.sy += 400
        self.blocks[pid] = {'opcode': 'procedures_prototype', 'next': None, 'parent': did, 'inputs': inputs,
                            'fields': {}, 'shadow': True, 'topLevel': False,
                            'mutation': {'tagName': 'mutation', 'children': [], 'proccode': proccode,
                                         'argumentids': json.dumps(argids), 'argumentnames': json.dumps(params),
                                         'argumentdefaults': json.dumps([''] * len(params)), 'warp': 'true'}}
        self.blocks[did]['next'] = self.seq(body, did)

    def to_json(self, layer):
        vars_ = {vid: [n, val] for n, (vid, val) in self.vars.items()}
        lists = {lid: [n, val] for n, (lid, val) in self.lists.items()}
        d = {'isStage': self.stage, 'name': self.name, 'variables': vars_, 'lists': lists, 'broadcasts': {},
             'blocks': self.blocks, 'comments': {}, 'currentCostume': 0, 'costumes': self.costumes,
             'sounds': self.sounds, 'volume': 100, 'layerOrder': layer}
        if self.stage:
            d['variables'] = {vid: [n, val] for n, (vid, val) in self.proj.globals.items()}
            d['lists'] = {lid: [n, val] for n, (lid, val) in self.proj.glists.items()}
            d['broadcasts'] = {bid: n for n, bid in self.proj.bcasts.items()}
            d.update({'tempo': 60, 'videoTransparency': 50, 'videoState': 'on', 'textToSpeechLanguage': None})
        else:
            d.update({'visible': True, 'x': 0, 'y': 0, 'size': 100, 'direction': 90, 'draggable': False,
                      'rotationStyle': 'all around'})
        return d


# ---------- atalhos ----------
def S(n, v): return Blk('data_setvariableto', {'VALUE': v}, {'VARIABLE': n})
def C(n, v): return Blk('data_changevariableby', {'VALUE': v}, {'VARIABLE': n})
def IF(c, *b): return Blk('control_if', {'CONDITION': c, 'SUBSTACK': list(b)})
def IFE(c, a, b): return Blk('control_if_else', {'CONDITION': c, 'SUBSTACK': a, 'SUBSTACK2': b})
def REP(n, *b): return Blk('control_repeat', {'TIMES': n, 'SUBSTACK': list(b)})
def FOREVER(*b): return Blk('control_forever', {'SUBSTACK': list(b)})
def UNTIL(c, *b): return Blk('control_repeat_until', {'CONDITION': c, 'SUBSTACK': list(b)})
def EQ(a, b): return Blk('operator_equals', {'OPERAND1': a, 'OPERAND2': b})
def LT(a, b): return Blk('operator_lt', {'OPERAND1': a, 'OPERAND2': b})
def GT(a, b): return Blk('operator_gt', {'OPERAND1': a, 'OPERAND2': b})
def NOT(a): return Blk('operator_not', {'OPERAND': a})
def NE(a, b): return NOT(EQ(a, b))
def GE(a, b): return NOT(LT(a, b))
def LE(a, b): return NOT(GT(a, b))


def AND(*xs):
    r = xs[0]
    for x in xs[1:]:
        r = Blk('operator_and', {'OPERAND1': r, 'OPERAND2': x})
    return r


def OR(*xs):
    r = xs[0]
    for x in xs[1:]:
        r = Blk('operator_or', {'OPERAND1': r, 'OPERAND2': x})
    return r


def ADD(a, b): return Blk('operator_add', {'NUM1': a, 'NUM2': b})
def SUB(a, b): return Blk('operator_subtract', {'NUM1': a, 'NUM2': b})
def MUL(a, b): return Blk('operator_multiply', {'NUM1': a, 'NUM2': b})
def DIV(a, b): return Blk('operator_divide', {'NUM1': a, 'NUM2': b})
def MOD(a, b): return Blk('operator_mod', {'NUM1': a, 'NUM2': b})
def RND(a, b): return Blk('operator_random', {'FROM': a, 'TO': b})
def ROUND(a): return Blk('operator_round', {'NUM': a})
def MATH(op, a): return Blk('operator_mathop', {'NUM': a}, {'OPERATOR': op})
def FLOOR(a): return MATH('floor', a)
def ABS(a): return MATH('abs', a)
def SIN(a): return MATH('sin', a)


def J(*xs):
    r = xs[-1]
    for x in reversed(xs[:-1]):
        r = Blk('operator_join', {'STRING1': x, 'STRING2': r})
    return r


def LETTER(i, s): return Blk('operator_letter_of', {'LETTER': i, 'STRING': s})
def LEN(s): return Blk('operator_length', {'STRING': s})
def ITEM(l, i): return Blk('data_itemoflist', {'INDEX': i}, {'LIST': l})
def LLEN(l): return Blk('data_lengthoflist', {}, {'LIST': l})
def LADD(l, v): return Blk('data_addtolist', {'ITEM': v}, {'LIST': l})
def LDEL(l, i): return Blk('data_deleteoflist', {'INDEX': i}, {'LIST': l})
def LCLR(l): return Blk('data_deletealloflist', {}, {'LIST': l})
def LREP(l, i, v): return Blk('data_replaceitemoflist', {'INDEX': i, 'ITEM': v}, {'LIST': l})
def CALL(name, *args): return Blk('procedures_call', {'args': list(args)}, proc=name)
def BC(m): return Blk('event_broadcast', {'BROADCAST_INPUT': m})
def GOTO(x, y): return Blk('motion_gotoxy', {'X': x, 'Y': y})
def SETX(x): return Blk('motion_setx', {'X': x})
def SETY(y): return Blk('motion_sety', {'Y': y})
def CHX(x): return Blk('motion_changexby', {'DX': x})
def CHY(y): return Blk('motion_changeyby', {'DY': y})
def MOVE(n): return Blk('motion_movesteps', {'STEPS': n})
def TURN(n): return Blk('motion_turnright', {'DEGREES': n})
def POINT(d): return Blk('motion_pointindirection', {'DIRECTION': d})
def TOWARD(n): return Blk('motion_pointtowards', {'TOWARDS': n})
def XPOS(): return Blk('motion_xposition')
def YPOS(): return Blk('motion_yposition')
def SHOW(): return Blk('looks_show')
def HIDE(): return Blk('looks_hide')
def COST(c): return Blk('looks_switchcostumeto', {'COSTUME': c})
def EFF(e, v): return Blk('looks_seteffectto', {'VALUE': v}, {'EFFECT': e})
def CHEFF(e, v): return Blk('looks_changeeffectby', {'CHANGE': v}, {'EFFECT': e})
def CLREFF(): return Blk('looks_cleargraphiceffects')
def SIZE(v): return Blk('looks_setsizeto', {'SIZE': v})
def SAY(t): return Blk('looks_say', {'MESSAGE': t})
def FRONT(): return Blk('looks_gotofrontback', {}, {'FRONT_BACK': 'front'})
def KEY(k): return Blk('sensing_keypressed', {'KEY_OPTION': k})
def TOUCH(n): return Blk('sensing_touchingobject', {'TOUCHINGOBJECTMENU': n})
def DIST(n): return Blk('sensing_distanceto', {'DISTANCETOMENU': n})
def MOUSE(): return Blk('sensing_mousedown')
def MX(): return Blk('sensing_mousex')
def MY(): return Blk('sensing_mousey')
def TIMER(): return Blk('sensing_timer')
def PLAY(s): return Blk('sound_play', {'SOUND_MENU': s})
def PCLEAR(): return Blk('pen_clear')
def PDOWN(): return Blk('pen_penDown')
def PUP(): return Blk('pen_penUp')
def PCOL(c): return Blk('pen_setPenColorToColor', {'COLOR': c})
def PSIZE(s): return Blk('pen_setPenSizeTo', {'SIZE': s})
def STAMP(): return Blk('pen_stamp')
def CLONE(): return Blk('control_create_clone_of', {'CLONE_OPTION': '_myself_'})
def DELCLONE(): return Blk('control_delete_this_clone')
def ROTSTYLE(s): return Blk('motion_setrotationstyle', {}, {'STYLE': s})
def STOP_THIS(): return Blk('control_stop', {}, {'STOP_OPTION': 'this script'}, {'tagName': 'mutation', 'children': [], 'hasnext': 'false'})
def FLAG(): return Blk('event_whenflagclicked')
def WHEN(m): return Blk('event_whenbroadcastreceived', {}, {'BROADCAST_OPTION': m})
def CLONEHAT(): return Blk('control_start_as_clone')


def CHAIN(cases, default=None):
    """cases: [(cond, [stmts])] -> if / senao encadeados."""
    if not cases:
        return default or []
    cond, body = cases[0]
    rest = CHAIN(cases[1:], default)
    if not rest:
        return IF(cond, *body)
    return IFE(cond, list(body), rest if isinstance(rest, list) else [rest])


# =====================================================================
# TEXTOS
# =====================================================================
LARG = 34


def W(*segs):
    lines = []
    for seg in segs:
        seg = seg.upper()
        cur = ''
        for word in seg.split(' '):
            t = (cur + ' ' + word) if cur else word
            if len(t) > LARG and cur:
                lines.append(cur)
                cur = word
            else:
                cur = t
        lines.append(cur)
    assert len(lines) <= 4, lines
    s = '|'.join(lines)
    for ch in s:
        assert ch in SUPPORTED, (ch, s)
    return s


def U1(s):
    s = s.upper()
    for ch in s:
        assert ch in SUPPORTED, (ch, s)
    return s


ITENS = [
    # nome, descricao
    ('CHOCOLATE MORNO', '+10 HP. DERRETEU UM POUQUINHO.'),
    ('REFRI SEM GÁS', '+5 HP. PELO MENOS É DOCE.'),
    ('VELA MISTERIOSA', 'EFEITO DESCONHECIDO...'),
    ('PÃO DE QUEIJO', '+15 HP. AINDA QUENTINHO.'),
    ('CAFÉ REQUENTADO', '+8 HP E VOCÊ FICA MAIS RÁPIDO.'),
    ('BISCOITO SORTE', '+6 HP E UMA PREVISÃO.'),
]
SORTES = [
    '"UM GRAMPO NO CAMINHO VALE DOIS NA GAVETA."',
    '"A LUZ QUE VOCÊ PROCURA ESTÁ NA TOMADA."',
    '"HOJE É UM ÓTIMO DIA PARA NÃO VIRAR TORRADA."',
    '"QUEM DESVIA POR ÚLTIMO DESVIA MELHOR."',
]

# Regras de AGIR: lista de (condicao, efeito). A condicao recebe funcoes auxiliares.
# usos(j) = quantas vezes a acao j ja foi usada nesta batalha; sat = satisfacao atual.


def usos(j): return ITEM('usos', j)


MONSTROS = [
 dict(
  pref='abaj', nome='ABAJURINO', hp=40, atq=3, exp=10, ele=True,
  moods=['APAVORADO', 'DESCONFIADO', 'TRANQUILO', 'SATISFEITO'],
  intro=W('* ABAJURINO bloqueia o caminho, piscando nervosamente.'),
  flavors=[W('* Abajurino tremelica.'), W('* Cheiro de poeira queimada.'),
           W('* Uma mariposa pousou na cúpula. Abajurino choraminga.'), W('* A luz pisca. Abajurino prende a respiração.')],
  low=W('* A luz do Abajurino está fraquinha...'),
  spareFlavor=W('* Abajurino brilha num tom calmo e quentinho.', 'Talvez você possa POUPÁ-LO.'),
  dores=['AI! Minha cúpula!', 'Por que todo mundo quer me APAGAR?!', 'Isso vai deixar marca na cúpula...'],
  miss='Errou! Q-quer dizer... ufa.',
  falas=[['N-não chega perto! O escuro tem COISAS!', 'Se eu piscar, você some? Ou EU sumo?', 'Minha lâmpada é de 40 watts... não é muito, sabe?'],
         ['Você... ainda tá aí? Que bom. Quer dizer... SAI!', 'Talvez nem todo mundo queira me desligar...'],
         ['Você é tipo uma lanterna em forma de gente.', 'Eu tô tremendo menos, viu?'],
         ['Acho que o escuro não é tão ruim com companhia.']],
  morte=W('* A luz do Abajurino se apagou para sempre.'),
  poupado=W('* Abajurino acende uma luz suave para iluminar o seu caminho.'),
  fuga=W('* Lá atrás, Abajurino grita: "VOLTA, TÁ ESCURO!"'),
  padroes=['mariposas', 'filamentos', 'apagao', 'feixes'],
  acoes=[
   ('CHECAR', [(None, dict(t=[W('* ABAJURINO - ATQ 3  DEF 2', '* Tem pavor do escuro. Mas ele é a única luz da sala.')]))]),
   ('ELOGIAR A LUZ', [
     (lambda: GE(usos(2), 2), dict(t=[W('* Você elogia a luz dele de novo.', '* Ele já está ficando convencido.')], sat=5, r='Eu sei, eu sei. Sou um arraso.')),
     (None, dict(t=[W('* Você diz que a luz dele é aconchegante.', '* Abajurino brilha mais forte.')], sat=25, r='V-você acha? É só uma lâmpada de 40 watts...'))]),
   ('SOMBRA DE COELHO', [
     (lambda: AND(GT(usos(2), 0), GT(usos(3), 0)), dict(t=[W('* Você faz o coelhinho de novo.', '* Ainda é engraçado.')], sat=10, r='Hihi! Faz um cachorro agora!')),
     (lambda: GT(usos(2), 0), dict(t=[W('* Você faz uma sombra de coelho na parede.', '* Abajurino ri tanto que a cúpula balança!')], sat=30, r='HAHA! Eu que fiz essa sombra! Eu sou um ARTISTA!')),
     (None, dict(t=[W('* Você faz uma sombra de coelho.', '* Abajurino acha que é um monstro e se encolhe. (Elogie a luz antes!)')], sat=5, r='AAAH! UM BICHO ORELHUDO NA PAREDE!'))]),
   ('HISTÓRIA DE MEDO', [
     (None, dict(t=[W('* Você conta a lenda do Fantasma do Disjuntor.', '* Abajurino ficou APAVORADO!', '* Os ataques ficaram mais rápidos!')], sat=-25, raiva=1, r='P-POR QUE VOCÊ FARIA ISSO COMIGO?!'))]),
   ('TAMBÉM TENHO MEDO', [
     (lambda: GT(usos(5), 0), dict(t=[W('* Você repete que também tem medo do escuro.', '* Ele já sabe. Mas gostou de ouvir.')], sat=5)),
     (None, dict(t=[W('* Você admite baixinho que também tem medo do escuro.', '* Abajurino para de tremer.')], sat=40, r='S-sério? Então... a gente pode ter medo JUNTOS?'))]),
  ]),
 dict(
  pref='tost', nome='TOSTADORA', hp=55, atq=4, exp=18, ele=False,
  moods=['ARROGANTE', 'CURIOSA', 'ENCANTADA', 'RADIANTE'],
  intro=W('* TOSTADORA entra em cena!', '* Os holofotes acendem sozinhos.'),
  flavors=[W('* Tostadora ensaia uma reverência.'), W('* Cheiro de pão queimado e ambição.'),
           W('* Tostadora finge desmaiar. Ninguém aplaude.'), W('* Uma migalha cai no palco em câmera lenta.')],
  low=W('* Tostadora está soltando fumaça... e não é efeito especial.'),
  spareFlavor=W('* Tostadora está radiante.', 'Talvez você possa POUPÁ-LA.'),
  dores=['QUE FALTA DE RESPEITO COM A ARTE!', 'Isso vai para as minhas memórias!', 'Meu lado esquerdo! Era o meu lado BOM!'],
  miss='Ha! Nem a crítica me atinge!',
  falas=[['Ser ou não ser... TORRADA! Eis a questão!', 'Você está no MEU palco, plebeu!', 'Ninguém entende a minha arte!'],
         ['Hmm... você tem bom gosto, admito.', 'Talvez você mereça um ingresso. Na última fila.'],
         ['Mais uma cena! Só mais uma!', 'Eu sinto o calor do público! Ou é a minha resistência...'],
         ['Obrigada, obrigada! Vocês são maravilhosos!']],
  morte=W('* Tostadora esfriou. As cortinas se fecharam.'),
  poupado=W('* Tostadora agradece e faz uma torrada dourada... e come ela mesma.'),
  fuga=W('* Você saiu no meio da peça. Tostadora jamais vai esquecer.'),
  padroes=['torradas', 'migalhas', 'ondas'],
  acoes=[
   ('CHECAR', [(None, dict(t=[W('* TOSTADORA - ATQ 4  DEF 3', '* Uma torradeira atriz. Sonha com o prêmio de Melhor Café da Manhã.')]))]),
   ('APLAUDIR', [
     (lambda: GE(usos(2), 2), dict(t=[W('* Você aplaude de novo.', '* Começa a soar meio falso.')], sat=5, r='Aplausos ensaiados? Eu percebo, viu?')),
     (None, dict(t=[W('* Você aplaude de pé!', '* Tostadora faz três reverências.')], sat=20, r='Obrigada! Eu sabia que tinha público aqui!'))]),
   ('PEDIR AUTÓGRAFO', [
     (lambda: EQ(usos(2), 0), dict(t=[W('* Você pede um autógrafo.', '* Ela desconfia. Você nem aplaudiu ainda!')], r='Autógrafo? Nem sei quem é você!')),
     (lambda: GT(usos(3), 0), dict(t=[W('* Você pede outro autógrafo.', '* Ela assina sua mão com farelo.')], sat=5)),
     (None, dict(t=[W('* Você pede um autógrafo com os olhos brilhando.', '* Ela queima a assinatura num guardanapo.')], sat=35, r='Para o meu fã número UM! Guarde com carinho!'))]),
   ('CHORAR DE EMOÇÃO', [
     (lambda: GT(usos(4), 0), dict(t=[W('* Você tenta chorar de novo, mas acabaram as lágrimas.')])),
     (None, dict(t=[W('* Você chora no monólogo da torrada queimada.', '* Tostadora se sente compreendida.')], sat=30, r='Você... você SENTIU a cena. Snif.'))]),
   ('CRITICAR ATUAÇÃO', [
     (None, dict(t=[W('* Você diz que a atuação foi "crua".', '* Ela esquentou. Literalmente!', '* Os ataques ficaram mais rápidos!')], sat=-25, raiva=1, r='CRUA?! EU SOU UMA TORRADEIRA! NADA SAI CRU DE MIM!'))]),
  ]),
 dict(
  pref='gram', nome='SR. GRAMPO', hp=70, atq=5, exp=30, ele=True,
  moods=['ESTRESSADO', 'OCUPADO', 'RELAXANDO', 'DE FOLGA'],
  intro=W('* SR. GRAMPO surge de trás de uma pilha de papéis.', '* Ele está ATRASADO.'),
  flavors=[W('* Sr. Grampo olha o relógio. De novo.'), W('* Cheiro de café frio e relatório.'),
           W('* Sr. Grampo grampeia o ar de nervoso.'), W('* Um e-mail chega. Sr. Grampo estremece.')],
  low=W('* Sr. Grampo está sem grampos... e sem paciência.'),
  spareFlavor=W('* Sr. Grampo afrouxou a gravata.', 'Talvez você possa POUPÁ-LO.'),
  dores=['ISSO VAI PRO SEU RELATÓRIO!', 'Agressão no ambiente de trabalho?!', 'Vou ter que preencher um formulário pra isso...'],
  miss='Errou. Igual à meta do trimestre.',
  falas=[['O prazo era ONTEM!', 'Você tem horário marcado? NÃO? Então sai!', 'Clic-clac! Esse é o som da produtividade!'],
         ['Hm. Você até que é eficiente.', 'Tá... talvez cinco minutinhos de pausa.'],
         ['Faz tempo que ninguém me trata como gente.', 'Será que o escritório sobrevive sem mim?'],
         ['Acho que vou tirar a tarde de folga. A PRIMEIRA desde 1998!']],
  morte=W('* Sr. Grampo foi arquivado. Permanentemente.'),
  poupado=W('* Sr. Grampo bate o ponto de saída pela primeira vez em décadas. Ele sorri.'),
  fuga=W('* Você fugiu. Sr. Grampo anota uma falta no seu nome.'),
  padroes=['grampos', 'papelada', 'prazo', 'carimbos'],
  acoes=[
   ('CHECAR', [(None, dict(t=[W('* SR. GRAMPO - ATQ 5  DEF 4', '* Gerente de escritório. Não tira férias desde 1998.')]))]),
   ('BATER PONTO', [
     (lambda: GT(usos(2), 0), dict(t=[W('* Você bate o ponto de novo.', '* Bater ponto duas vezes é fraude!')], sat=-5, r='FRAUDE NO PONTO! Vou abrir um chamado!')),
     (None, dict(t=[W('* Você bate o ponto no horário.', '* Sr. Grampo aprova com a cabeça.')], sat=15, r='Pontual! Finalmente alguém responsável!'))]),
   ('ELOGIAR PLANILHA', [
     (lambda: GT(usos(3), 0), dict(t=[W('* Você elogia a planilha de novo.', '* Ele já mandou ela por e-mail. Três vezes.')], sat=5)),
     (None, dict(t=[W('* Você elogia as fórmulas da planilha.', '* Tem até tabela dinâmica. Ele fica vermelho.')], sat=25, r='Você reparou no PROCV? Ninguém repara no PROCV!'))]),
   ('TRABALHAR JUNTO', [
     (lambda: GT(usos(4), 0), dict(t=[W('* Vocês organizam mais clipes.', '* Produtividade estável.')], sat=5)),
     (None, dict(t=[W('* Você ajuda a organizar os clipes por cor.', '* Produtividade +12%!')], sat=20, r='Trabalho em equipe... eu tinha esquecido como era.'))]),
   ('SUGERIR FÉRIAS', [
     (lambda: LT(V('M_sat'), 40), dict(t=[W('* Você sugere que ele tire férias.', '* Ainda é cedo demais! Ele ficou furioso!')], sat=-10, raiva=1, r='FÉRIAS?! COM ESSE PRAZO?! ENLOUQUECEU?!')),
     (lambda: GT(usos(5), 0), dict(t=[W('* Você mostra fotos da praia de novo.', '* Ele suspira.')], sat=10)),
     (None, dict(t=[W('* Você sugere que ele tire férias.', '* Uma lágrima de tinta escorre.')], sat=45, r='Férias... tipo... praia? Sem e-mail? Isso existe?'))]),
   ('PEDIR AUMENTO', [
     (None, dict(t=[W('* Você pede um aumento.', '* Ele grampeia o pedido na parede.', '* Ele ficou bravo!')], sat=-15, raiva=1, r='AUMENTO?! Só se for de CARGA HORÁRIA!'))]),
  ]),
]

INTERLUDIOS = [
    dict(t=[W('* Você segue pelo corredor escuro da casa.'), W('* No chão, um PÃO DE QUEIJO ainda quentinho!'),
            W('* Você se sentou no sofá por um instante.', '* HP restaurado.')], itens=[4]),
    dict(t=[W('* Do escritório no fim do corredor vem um som: clic-clac, clic-clac.'),
            W('* Na mesa: um CAFÉ REQUENTADO e um CHOCOLATE MORNO!'), W('* Você respirou fundo.', '* HP restaurado.')], itens=[5, 1]),
]

# tamanho da caixa (largura, altura, duracao em quadros) de cada padrao de ataque
PADROES = {
    'mariposas': (180, 110, 195), 'filamentos': (190, 110, 190), 'apagao': (170, 110, 200), 'feixes': (180, 110, 195),
    'torradas': (190, 120, 195), 'migalhas': (170, 110, 190), 'ondas': (200, 100, 210),
    'grampos': (220, 100, 210), 'papelada': (190, 110, 200), 'prazo': (130, 130, 210), 'carimbos': (180, 110, 195),
}

# =====================================================================
# DESENHOS (SVG)
# =====================================================================
INK = '#f4ead2'
DARK = '#1b1430'


def eye(cx, cy, rx, ry, pr, dx=0, dy=1):
    return (f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="#fff" stroke="{DARK}" stroke-width="1.5"/>'
            f'<circle cx="{cx + dx}" cy="{cy + dy}" r="{pr}" fill="{DARK}"/>'
            f'<circle cx="{cx + dx - 1}" cy="{cy + dy - 1}" r="{pr * 0.35:.2f}" fill="#fff"/>')


def svg_abaj(feliz):
    b = ('<defs><radialGradient id="g" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ffc85a" stop-opacity="0.45"/>'
         '<stop offset="1" stop-color="#ffc85a" stop-opacity="0"/></radialGradient></defs>'
         '<ellipse cx="120" cy="78" rx="118" ry="84" fill="url(#g)"/>'
         f'<ellipse cx="120" cy="158" rx="38" ry="8" fill="#3a2a4a" stroke="{INK}" stroke-width="2.5"/>'
         '<line x1="120" y1="152" x2="120" y2="84" stroke="#c9b89a" stroke-width="5"/>')
    if feliz:
        b += f'<path d="M120 116 Q104 108 92 92 M120 116 Q136 108 148 92" stroke="{INK}" stroke-width="3" fill="none" stroke-linecap="round"/>'
    else:
        b += f'<path d="M120 116 Q104 112 92 104 M120 116 Q136 112 148 104" stroke="{INK}" stroke-width="3" fill="none" stroke-linecap="round"/>'
    b += ('<circle cx="120" cy="88" r="11" fill="#fff1c2"/>'
          f'<polygon points="90,20 150,20 178,80 62,80" fill="#f1d9a6" stroke="{INK}" stroke-width="2.5"/>')
    for i in range(-2, 3):
        b += f'<line x1="{120 + i * 12}" y1="22" x2="{120 + i * 22}" y2="78" stroke="#a06e3c" stroke-opacity="0.35" stroke-width="1.5"/>'
    for i in range(-52, 56, 8):
        b += f'<line x1="{120 + i}" y1="80" x2="{120 + i}" y2="86" stroke="{INK}" stroke-width="1.5"/>'
    if feliz:
        b += eye(103, 50, 8, 10, 3.5) + eye(137, 50, 8, 10, 3.5)
        b += f'<path d="M111 62 Q120 72 129 62" stroke="{DARK}" stroke-width="2.5" fill="none" stroke-linecap="round"/>'
        b += '<ellipse cx="94" cy="64" rx="6" ry="3.5" fill="#ff8aa0" fill-opacity="0.6"/><ellipse cx="146" cy="64" rx="6" ry="3.5" fill="#ff8aa0" fill-opacity="0.6"/>'
    else:
        b += eye(103, 50, 8, 10, 2.5, 0, 0) + eye(137, 50, 8, 10, 2.5, 0, 0)
        b += f'<path d="M95 35 L111 39 M145 35 L129 39" stroke="{DARK}" stroke-width="2.5" stroke-linecap="round"/>'
        b += f'<path d="M110 66 L113 63 L116 66 L119 63 L122 66 L125 63 L128 66 L131 63" stroke="{DARK}" stroke-width="2" fill="none"/>'
    return svg_doc(240, 170, b)


def svg_tost(feliz):
    b = ''
    for x, y in ((78, 6), (129, 2)):
        b += f'<rect x="{x}" y="{y}" width="33" height="32" rx="8" fill="#8a5a2b"/><rect x="{x + 3}" y="{y + 3}" width="27" height="28" rx="6" fill="#e3ae63"/>'
    b += ('<defs><linearGradient id="t" x1="0" x2="1"><stop offset="0" stop-color="#8f86a8"/><stop offset="0.35" stop-color="#e6e0f0"/>'
          '<stop offset="1" stop-color="#7a7194"/></linearGradient></defs>'
          f'<rect x="56" y="30" width="128" height="80" rx="18" fill="url(#t)" stroke="{INK}" stroke-width="2.5"/>'
          f'<rect x="78" y="27" width="38" height="7" rx="3" fill="{DARK}"/><rect x="124" y="27" width="38" height="7" rx="3" fill="{DARK}"/>'
          '<rect x="184" y="52" width="6" height="30" fill="#3a3150"/><rect x="186" y="60" width="14" height="8" rx="2" fill="#ff4f6d"/>'
          '<rect x="66" y="108" width="20" height="9" rx="3" fill="#2d2640"/><rect x="154" y="108" width="20" height="9" rx="3" fill="#2d2640"/>')
    b += eye(98, 62, 11, 10, 3.8) + eye(142, 62, 11, 10, 3.8)
    for s in (-1, 1):
        for i in range(3):
            x0 = 120 + s * 22 + s * (5 + i * 4)
            b += f'<line x1="{x0}" y1="{53 + i * 1.5}" x2="{x0 + s * 4}" y2="{47 + i * 2}" stroke="{DARK}" stroke-width="2"/>'
    if feliz:
        b += f'<path d="M110 78 A10 10 0 0 0 130 78 Z" fill="{DARK}"/>'
        b += '<ellipse cx="82" cy="78" rx="8" ry="4.5" fill="#ff6e8c" fill-opacity="0.45"/><ellipse cx="158" cy="78" rx="8" ry="4.5" fill="#ff6e8c" fill-opacity="0.45"/>'
        for x, y in ((40, 40), (200, 30), (30, 100), (210, 110)):
            b += f'<polygon points="{x},{y - 7} {x + 2},{y - 2} {x + 7},{y} {x + 2},{y + 2} {x},{y + 7} {x - 2},{y + 2} {x - 7},{y} {x - 2},{y - 2}" fill="#ffe14d"/>'
    else:
        b += f'<ellipse cx="120" cy="84" rx="6" ry="8" fill="{DARK}"/>'
        b += f'<path d="M84 46 L106 50 M156 46 L134 50" stroke="{DARK}" stroke-width="2.5" stroke-linecap="round"/>'
        b += '<circle cx="104" cy="-2" r="0" fill="none"/>'
    return svg_doc(240, 125, b)


def svg_gram(feliz):
    tie = '#8a6bd6' if feliz else '#c43c4c'
    b = (f'<polygon points="122,118 134,118 137,140 128,148 119,140" fill="{tie}"/>'
         f'<rect x="28" y="102" width="200" height="18" rx="6" fill="#2d2b40" stroke="{INK}" stroke-width="2.5"/>'
         f'<g transform="rotate(-3 222 100)"><rect x="30" y="66" width="196" height="32" rx="11" fill="#3f8f9a" stroke="{INK}" stroke-width="2.5"/>'
         '<rect x="40" y="70" width="170" height="6" rx="3" fill="#ffffff" fill-opacity="0.2"/>')
    b += eye(82, 84, 9, 8, 3) + eye(116, 84, 9, 8, 3)
    b += (f'<rect x="71" y="74" width="22" height="20" fill="none" stroke="{DARK}" stroke-width="2"/>'
          f'<rect x="105" y="74" width="22" height="20" fill="none" stroke="{DARK}" stroke-width="2"/>'
          f'<line x1="93" y1="84" x2="105" y2="84" stroke="{DARK}" stroke-width="2"/>')
    if feliz:
        b += f'<path d="M72 68 L92 66 M106 66 L126 68" stroke="{DARK}" stroke-width="3" stroke-linecap="round"/>'
    else:
        b += f'<path d="M72 64 L92 70 M126 64 L106 70" stroke="{DARK}" stroke-width="3" stroke-linecap="round"/>'
    b += '</g>'
    b += f'<circle cx="222" cy="100" r="7" fill="{DARK}" stroke="{INK}" stroke-width="1.5"/>'
    if feliz:
        b += '<circle cx="20" cy="30" r="9" fill="#ffe14d"/>'
        for k in range(8):
            a = k * math.pi / 4
            b += f'<line x1="{20 + math.cos(a) * 12:.1f}" y1="{30 + math.sin(a) * 12:.1f}" x2="{20 + math.cos(a) * 17:.1f}" y2="{30 + math.sin(a) * 17:.1f}" stroke="#ffe14d" stroke-width="2"/>'
    else:
        b += '<ellipse cx="18" cy="70" rx="4" ry="6" fill="#7fd0ff"/>'
    return svg_doc(260, 150, b)


def heart_path(color, s=1.0):
    return (f'<path transform="scale({s})" d="M8 14 C6 11 0 9 0 5 C0 1 5 -0.5 8 3.5 C11 -0.5 16 1 16 5 C16 9 10 11 8 14 Z" fill="{color}"/>')


def bala_costumes():
    cs = []
    add = lambda n, w, h, body, cx=None, cy=None: cs.append(costume(n, svg_doc(w, h, body), w / 2 if cx is None else cx, h / 2 if cy is None else cy))
    add('mariposa', 16, 14, '<ellipse cx="8" cy="3.5" rx="5" ry="3.5" fill="#d8ccb0"/><ellipse cx="8" cy="10.5" rx="5" ry="3.5" fill="#d8ccb0"/><rect x="3" y="5.5" width="12" height="3" rx="1.5" fill="#5b4b3a"/>')
    add('aviso_col', 8, 110, '<rect x="0" y="0" width="8" height="110" fill="#ffc85a" fill-opacity="0.25"/>')
    add('filamento', 6, 34, '<rect x="0" y="0" width="6" height="34" rx="2" fill="#ffc85a"/><rect x="2.2" y="0" width="1.6" height="34" fill="#fff6d8"/>')
    add('faisca', 12, 12, '<polygon points="6,0 7.6,4.4 12,6 7.6,7.6 6,12 4.4,7.6 0,6 4.4,4.4" fill="#ffe9a8"/>')
    add('aviso_h', 180, 14, '<rect x="1" y="1" width="178" height="12" fill="none" stroke="#ffc85a" stroke-width="2" stroke-dasharray="6 5"/>')
    add('feixe_h', 180, 14, '<rect x="0" y="0" width="180" height="14" fill="#ffd678"/><rect x="0" y="5" width="180" height="4" fill="#fffbe9"/>')
    add('aviso_v', 14, 110, '<rect x="1" y="1" width="12" height="108" fill="none" stroke="#ffc85a" stroke-width="2" stroke-dasharray="6 5"/>')
    add('feixe_v', 14, 110, '<rect x="0" y="0" width="14" height="110" fill="#ffd678"/><rect x="5" y="0" width="4" height="110" fill="#fffbe9"/>')
    add('torrada', 18, 16, '<rect x="0" y="0" width="18" height="16" rx="5" fill="#8a5a2b"/><rect x="2.5" y="2.5" width="13" height="11.5" rx="3.5" fill="#e3ae63"/><rect x="5" y="7" width="1.6" height="2.2" fill="#2b1a0e"/><rect x="11" y="7" width="1.6" height="2.2" fill="#2b1a0e"/>')
    add('migalha', 6, 6, '<circle cx="3" cy="3" r="2.6" fill="#e2b46c"/>')
    add('migalha_g', 14, 14, '<circle cx="7" cy="7" r="6.5" fill="#b77a3a"/>')
    add('onda_azul', 10, 100, '<rect x="0" y="0" width="10" height="100" fill="#4fb8ff"/><rect x="3.5" y="0" width="3" height="100" fill="#ffffff" fill-opacity="0.55"/>')
    add('onda_laranja', 10, 100, '<rect x="0" y="0" width="10" height="100" fill="#ff9a3c"/><rect x="3.5" y="0" width="3" height="100" fill="#ffffff" fill-opacity="0.55"/>')
    add('grampo_p', 12, 14, '<path d="M1.5 14 L1.5 1.5 L10.5 1.5 L10.5 14" fill="none" stroke="#d6dbe8" stroke-width="3"/>')
    add('grampo_g', 12, 24, '<path d="M1.5 24 L1.5 1.5 L10.5 1.5 L10.5 24" fill="none" stroke="#d6dbe8" stroke-width="3"/>')
    add('grampo_voo', 24, 9, '<path d="M24 1.5 L1.5 1.5 L1.5 7.5 L24 7.5" fill="none" stroke="#d6dbe8" stroke-width="3"/>')
    add('papel', 16, 14, '<rect x="0" y="0" width="16" height="14" fill="#f4f0e6"/><rect x="3" y="3" width="11" height="1.2" fill="#9aa6c4"/><rect x="3" y="6.5" width="11" height="1.2" fill="#9aa6c4"/><rect x="3" y="10" width="11" height="1.2" fill="#9aa6c4"/><rect x="1.5" y="0" width="1" height="14" fill="#d9534f"/>')
    add('ponteiro_a', 60, 6, f'<rect x="0" y="0" width="60" height="6" rx="3" fill="{INK}"/>', 3, 3)
    add('ponteiro_b', 44, 8, '<rect x="0" y="0" width="44" height="8" rx="4" fill="#ffc85a"/>', 4, 4)
    add('eixo', 14, 14, f'<circle cx="7" cy="7" r="6.5" fill="{INK}"/>')
    add('alvo', 38, 38, '<circle cx="19" cy="19" r="17" fill="#d9534f" fill-opacity="0.3" stroke="#d9534f" stroke-width="2"/>')
    add('carimbo', 36, 36, '<rect x="0" y="0" width="36" height="36" fill="#5a3a2a"/><rect x="3" y="3" width="30" height="30" fill="#d9534f"/><rect x="8" y="12" width="20" height="3" fill="#fff"/><rect x="8" y="21" width="20" height="3" fill="#fff"/>')
    return cs


# =====================================================================
# MONTAGEM DO PROJETO
# =====================================================================
def build():
    P = Project()
    G = P.globals
    GL = P.glists

    def gv(name, val=0):
        G[name] = ('g_' + name, val)

    def gl(name, val=None):
        GL[name] = ('gl_' + name, list(val or []))

    for n in ['cena', 'P_hp', 'P_max', 'P_lv', 'P_exp', 'P_atk', 'batalha', 'M_nome', 'M_hp', 'M_max', 'M_hpv', 'M_sat',
              'M_raiva', 'M_turno', 'M_atq', 'M_exp', 'M_estado', 'M_ele', 'M_pref', 'M_tremor', 'm_check', 'm_low',
              'm_spare', 'm_morte', 'm_poupado', 'm_fuga', 'm_miss', 'resposta', 'fala', 'fala_n', 'tq_i', 'tq_n',
              'tq_depois', 'flavor', 'flavor_n', 'menuSel', 'subSel', 'subTipo', 'fb_x', 'fb_parado', 'fb_t', 'fb_res',
              'fb_crit', 'cx1', 'cy1', 'cx2', 'cy2', 'tx1', 'ty1', 'tx2', 'ty2', 'padrao', 'ultimo', 'taxa', 'desvio_t',
              'dur', 'alma_modo', 'alma_movendo', 'alma_x', 'alma_y', 'iframe', 'acerto', 'rapido', 'res', 'go_t',
              'fim_t', 'fx_txt', 'fx_t', 'fx_cor', 'fx_x', 'fx_y', 'dmg_txt', 'dmg_t', 'dmg_cor', 'quadro',
              'k_ok', 'k_x', 'k_l', 'k_r', 'k_u', 'k_d', 'k_m', 'ok', 'voltar', 'esq', 'dir', 'cima', 'baixo', 'clique',
              'b_lv', 'b_exp', 'b_max', 'b_atk']:
        gv(n, 0)
    G['cena'] = ('g_cena', 'titulo')
    for n in ['textos', 'acoes', 'flavors', 'falas', 'dores', 'padroes', 'usos', 'inventario', 'inv_bkp', 'subItens',
              'res_nomes', 'res_tipos', 'moods']:
        gl(n)
    gl('itemNomes', [n for n, _ in ITENS])
    gl('itemDescs', [d for _, d in ITENS])
    gl('lvExp', [10, 30, 60, 999999])
    gl('sortes', SORTES)

    stage = Target(P, 'Stage', stage=True)
    stage.costumes = [costume('noite', svg_doc(480, 360, '<rect x="0" y="0" width="480" height="360" fill="#07060f"/>'), 240, 180)]

    # ================= SPRITE JOGO (logica + desenho com caneta) =================
    T = Target(P, 'Jogo')
    T.costumes = [costume('vazio', svg_doc(2, 2, ''), 1, 1)] + [costume(ch, glyph_svg(glyph_rows(ch)), 0, 0) for ch in FONT_CHARS]
    T.sounds = [
        wav('tecla', [(280, 280, 0.025, 'sq', 0.25)]),
        wav('fala', [(170, 150, 0.035, 'tri', 0.5)]),
        wav('mover', [(520, 520, 0.04, 'sq', 0.3)]),
        wav('selecionar', [(660, 660, 0.05, 'sq', 0.35), (990, 990, 0.07, 'sq', 0.3)]),
        wav('erro', [(140, 140, 0.15, 'sq', 0.4)]),
        wav('corte', [(900, 200, 0.18, 'saw', 0.35)]),
        wav('golpe', [(110, 60, 0.28, 'sq', 0.55)]),
        wav('errou', [(400, 150, 0.2, 'tri', 0.45)]),
        wav('dano', [(200, 60, 0.22, 'saw', 0.55)]),
        wav('cura', [(523, 523, 0.08, 'sq', 0.3), (659, 659, 0.08, 'sq', 0.3), (784, 784, 0.14, 'sq', 0.3)]),
        wav('poupar', [(523, 523, 0.12, 'tri', 0.5), (659, 659, 0.12, 'tri', 0.5), (784, 784, 0.12, 'tri', 0.5), (1046, 1046, 0.2, 'tri', 0.5)]),
        wav('lvup', [(392, 392, 0.1, 'sq', 0.3), (523, 523, 0.1, 'sq', 0.3), (659, 659, 0.1, 'sq', 0.3), (784, 784, 0.15, 'sq', 0.3)]),
        wav('quebra', [(500, 300, 0.1, 'sq', 0.5), (120, 60, 0.5, 'saw', 0.45)]),
        wav('fuga', [(700, 700, 0.05, 'sq', 0.3), (600, 600, 0.05, 'sq', 0.3), (500, 500, 0.05, 'sq', 0.3), (400, 400, 0.06, 'sq', 0.3)]),
        wav('desfaz', [(300, 40, 0.8, 'saw', 0.4)]),
    ]
    for n in ['_lx', '_ly', '_li', '_lc', '_x', '_y', '_i', '_c', '_lim', '_adv', '_k', '_col', '_row', '_w', '_old', '_d', '_dist', '_mult', '_n', '_t', '_b', '_tit']:
        T.var(n, 0)

    procs = {
        'escrever': ['t', 'x', 'y', 'n', 'cor', 'esc'], 'centro': ['t', 'cx', 'y', 'cor', 'esc'],
        'cor': ['c'], 'ret': ['x1', 'y1', 'x2', 'y2'], 'barra': ['x', 'y', 'w', 'h'],
        'ler teclas': [], 'atualizar': [], 'desenhar': [], 'iniciar jogo': [], 'iniciar batalha': ['n'],
        'mostrar': ['depois'], 'continuar': [], 'ir menu': [], 'escolher': ['i'], 'executar sub': [],
        'fazer acao': ['i'], 'usar item': ['i'], 'curar': ['n', 'linha'], 'mudar sat': ['d'], 'poupar': [],
        'fugir': [], 'resolver': ['errou'], 'depois luta': [], 'turno inimigo': [], 'iniciar desvio': [],
        'levar dano': [], 'fim batalha': [], 'game over': [], 'painel': [], 'conteudo': [], 'status': [],
        'botoes': [], 'tela titulo': [], 'tela gameover': [], 'tela fim': [], 'caixa menu': [],
    }
    for n, ps in procs.items():
        T.declare(n, ps)
    A = Arg

    # ---- texto ----
    T.define('cor', [
        CLREFF(),
        CHAIN([
            (EQ(A('c'), 'branco'), [EFF('BRIGHTNESS', 100)]),
            (EQ(A('c'), 'cinza'), [EFF('BRIGHTNESS', 100), EFF('GHOST', 55)]),
            (EQ(A('c'), 'amarelo'), [EFF('COLOR', 33)]),
            (EQ(A('c'), 'ambar'), [EFF('COLOR', 22)]),
            (EQ(A('c'), 'laranja'), [EFF('COLOR', 12)]),
            (EQ(A('c'), 'azul'), [EFF('COLOR', 117)]),
            (EQ(A('c'), 'verde'), [EFF('COLOR', 55)]),
            (EQ(A('c'), 'preto'), [EFF('BRIGHTNESS', -100)]),
        ]),
    ])
    T.define('escrever', [
        CALL('cor', A('cor')),
        SIZE(A('esc')),
        S('_adv', MUL(12, DIV(A('esc'), 100))),
        S('_x', A('x')), S('_y', A('y')), S('_i', 0),
        S('_lim', FLOOR(A('n'))),
        IF(GT(V('_lim'), LEN(A('t'))), S('_lim', LEN(A('t')))),
        REP(V('_lim'),
            C('_i', 1),
            S('_c', LETTER(V('_i'), A('t'))),
            IFE(EQ(V('_c'), '|'),
                [S('_x', A('x')), C('_y', MUL(-22, DIV(A('esc'), 100)))],
                [IF(NOT(EQ(V('_c'), ' ')), COST(V('_c')), GOTO(V('_x'), V('_y')), STAMP()),
                 C('_x', V('_adv'))])),
        COST('vazio'), SIZE(100), CLREFF(),
    ])
    T.define('centro', [
        CALL('escrever', A('t'), SUB(A('cx'), DIV(MUL(LEN(A('t')), MUL(12, DIV(A('esc'), 100))), 2)), A('y'), 999, A('cor'), A('esc')),
    ])
    T.define('ret', [
        PUP(), GOTO(A('x1'), A('y1')), PDOWN(), GOTO(A('x2'), A('y1')), GOTO(A('x2'), A('y2')),
        GOTO(A('x1'), A('y2')), GOTO(A('x1'), A('y1')), PUP(),
    ])
    T.define('barra', [
        PSIZE(A('h')), PUP(),
        IFE(GT(A('w'), A('h')),
            [GOTO(ADD(A('x'), DIV(A('h'), 2)), A('y')), PDOWN(), GOTO(SUB(ADD(A('x'), A('w')), DIV(A('h'), 2)), A('y'))],
            [IF(GT(A('w'), 0), GOTO(ADD(A('x'), DIV(A('w'), 2)), A('y')), PSIZE(A('w')), PDOWN())]),
        PUP(),
    ])

    # ---- teclado / mouse (detecta o momento em que a tecla foi apertada) ----
    def edge(flag, prev, cond):
        return [S(flag, 0), IFE(cond, [IF(EQ(V(prev), 0), S(flag, 1)), S(prev, 1)], [S(prev, 0)])]
    T.define('ler teclas', [
        edge('ok', 'k_ok', OR(KEY('z'), KEY('space'), KEY('enter'))),
        edge('voltar', 'k_x', KEY('x')),
        edge('esq', 'k_l', KEY('left arrow')),
        edge('dir', 'k_r', KEY('right arrow')),
        edge('cima', 'k_u', KEY('up arrow')),
        edge('baixo', 'k_d', KEY('down arrow')),
        edge('clique', 'k_m', MOUSE()),
    ])

    T.define('caixa menu', [S('tx1', -225), S('tx2', 225), S('ty1', -60), S('ty2', 40)])

    # ---- inicio ----
    T.define('iniciar jogo', [
        S('P_lv', 1), S('P_exp', 0), S('P_hp', 20), S('P_max', 20), S('P_atk', 5), S('rapido', 0),
        LCLR('inventario'), LADD('inventario', 1), LADD('inventario', 2), LADD('inventario', 3), LADD('inventario', 6),
        LCLR('res_nomes'), LCLR('res_tipos'),
        CALL('iniciar batalha', 1),
    ])

    def carregar(m):
        b = [S('M_nome', m['nome']), S('M_hp', m['hp']), S('M_max', m['hp']), S('M_hpv', m['hp']), S('M_atq', m['atq']),
             S('M_exp', m['exp']), S('M_ele', 1 if m['ele'] else 0), S('M_pref', m['pref']),
             S('m_low', m['low']), S('m_spare', m['spareFlavor']), S('m_morte', m['morte']),
             S('m_poupado', m['poupado']), S('m_fuga', m['fuga']), S('m_miss', m['miss'])]
        for nome, _ in m['acoes']:
            b.append(LADD('acoes', nome))
        for f in m['flavors']:
            b.append(LADD('flavors', f))
        for band in m['falas']:
            for k in range(3):
                b.append(LADD('falas', band[k % len(band)]))
        for d in m['dores']:
            b.append(LADD('dores', d))
        for p in m['padroes']:
            b.append(LADD('padroes', p))
        for md in m['moods']:
            b.append(LADD('moods', md))
        b.append(LADD('textos', m['intro']))
        return b

    T.define('iniciar batalha', [
        S('batalha', A('n')),
        LCLR('acoes'), LCLR('flavors'), LCLR('falas'), LCLR('dores'), LCLR('padroes'), LCLR('usos'), LCLR('moods'), LCLR('textos'),
        REP(6, LADD('usos', 0)),
        S('M_sat', 0), S('M_raiva', 0), S('M_turno', 0), S('M_estado', 'vivo'), S('M_tremor', 0), S('resposta', ''),
        S('ultimo', ''), S('menuSel', 1), S('dmg_t', 0), S('fx_t', 0),
        S('b_lv', V('P_lv')), S('b_exp', V('P_exp')), S('b_max', V('P_max')), S('b_atk', V('P_atk')),
        LCLR('inv_bkp'), S('_i', 0), REP(LLEN('inventario'), C('_i', 1), LADD('inv_bkp', ITEM('inventario', V('_i')))),
        CHAIN([(EQ(A('n'), i + 1), carregar(m)) for i, m in enumerate(MONSTROS)]),
        CALL('caixa menu'),
        BC('nova batalha'),
        CALL('mostrar', 'menu'),
    ])

    T.define('mostrar', [S('tq_depois', A('depois')), S('tq_i', 1), S('tq_n', 0), S('cena', 'texto')])
    T.define('continuar', [
        LCLR('textos'),
        CHAIN([
            (EQ(V('tq_depois'), 'menu'), [CALL('ir menu')]),
            (EQ(V('tq_depois'), 'inimigo'), [CALL('turno inimigo')]),
            (EQ(V('tq_depois'), 'fim'), [CALL('fim batalha')]),
            (EQ(V('tq_depois'), 'proxima'), [CALL('iniciar batalha', ADD(V('batalha'), 1))]),
        ]),
    ])
    T.define('ir menu', [
        S('cena', 'menu'), CALL('caixa menu'), S('flavor_n', 0),
        CHAIN([
            (GE(V('M_sat'), 100), [S('flavor', V('m_spare'))]),
            (LT(V('M_hp'), MUL(V('M_max'), 0.3)), [S('flavor', V('m_low'))]),
        ], [S('flavor', ITEM('flavors', RND(1, LLEN('flavors'))))]),
    ])

    T.define('escolher', [
        S('menuSel', A('i')),
        CHAIN([
            (EQ(A('i'), 1), [PLAY('selecionar'), S('cena', 'luta'), S('fb_x', 0), S('fb_parado', 0), S('fb_t', 0)]),
            (EQ(A('i'), 2), [PLAY('selecionar'), LCLR('subItens'), S('_i', 0),
                             REP(LLEN('acoes'), C('_i', 1), LADD('subItens', ITEM('acoes', V('_i')))),
                             S('subTipo', 'agir'), S('subSel', 1), S('cena', 'sub')]),
            (EQ(A('i'), 3), [IFE(EQ(LLEN('inventario'), 0),
                                 [PLAY('erro'), S('flavor', W('* Sua mochila está vazia.')), S('flavor_n', 0)],
                                 [PLAY('selecionar'), LCLR('subItens'), S('_i', 0),
                                  REP(LLEN('inventario'), C('_i', 1), LADD('subItens', ITEM('itemNomes', ITEM('inventario', V('_i'))))),
                                  S('subTipo', 'item'), S('subSel', 1), S('cena', 'sub')])]),
            (EQ(A('i'), 4), [PLAY('selecionar'), LCLR('subItens'), LADD('subItens', 'POUPAR'), LADD('subItens', 'FUGIR'),
                             S('subTipo', 'poupar'), S('subSel', 1), S('cena', 'sub')]),
        ]),
    ])
    T.define('executar sub', [
        PLAY('selecionar'),
        CHAIN([
            (EQ(V('subTipo'), 'agir'), [CALL('fazer acao', V('subSel'))]),
            (EQ(V('subTipo'), 'item'), [CALL('usar item', V('subSel'))]),
        ], [IFE(EQ(V('subSel'), 1), [CALL('poupar')], [CALL('fugir')])]),
    ])

    # ---- AGIR ----
    def efeito(e):
        b = [LADD('textos', t) for t in e['t']]
        if e.get('sat'):
            b.append(CALL('mudar sat', e['sat']))
        if e.get('raiva'):
            b.append(IF(LT(V('M_raiva'), 3), C('M_raiva', 1)))
        if e.get('r'):
            b.append(S('resposta', e['r']))
        return b

    def regras(rs):
        cases = []
        default = None
        for cond, e in rs:
            if cond is None:
                default = efeito(e)
            else:
                cases.append((cond(), efeito(e)))
        if not cases:
            return default
        return CHAIN(cases, default)

    batalha_cases = []
    for bi, m in enumerate(MONSTROS):
        acts = []
        for ai, (nome, rs) in enumerate(m['acoes']):
            acts.append((EQ(A('i'), ai + 1), [regras(rs)]))
        batalha_cases.append((EQ(V('batalha'), bi + 1), [CHAIN(acts)]))
    T.define('fazer acao', [
        C('M_turno', 1),
        CHAIN(batalha_cases),
        LREP('usos', A('i'), ADD(ITEM('usos', A('i')), 1)),
        CALL('mostrar', 'inimigo'),
    ])

    T.define('mudar sat', [
        S('_old', V('M_sat')), C('M_sat', A('d')),
        IF(GT(V('M_sat'), 100), S('M_sat', 100)), IF(LT(V('M_sat'), 0), S('M_sat', 0)),
        S('_d', SUB(V('M_sat'), V('_old'))),
        IF(NOT(EQ(V('_d'), 0)),
           IFE(GT(V('_d'), 0), [S('fx_txt', J('+', V('_d'), '%')), S('fx_cor', 'amarelo')],
               [S('fx_txt', J(V('_d'), '%')), S('fx_cor', 'vermelho')]),
           S('fx_x', -205), S('fx_y', 92), S('fx_t', 30)),
        IF(AND(LT(V('_old'), 100), GE(V('M_sat'), 100)), PLAY('poupar')),
    ])

    # ---- ITEM ----
    T.define('curar', [
        S('_old', V('P_hp')), C('P_hp', A('n')), IF(GT(V('P_hp'), V('P_max')), S('P_hp', V('P_max'))),
        PLAY('cura'), LADD('textos', A('linha')),
        IFE(EQ(V('P_hp'), V('P_max')), [LADD('textos', W('* Seu HP está no máximo!'))],
            [LADD('textos', J('* VOCÊ RECUPEROU ', SUB(V('P_hp'), V('_old')), ' HP.'))]),
    ])
    T.define('usar item', [
        S('_k', ITEM('inventario', A('i'))), LDEL('inventario', A('i')), C('M_turno', 1),
        CHAIN([
            (EQ(V('_k'), 1), [CALL('curar', 10, W('* Você comeu o Chocolate Morno.', 'Grudou nos dedos.'))]),
            (EQ(V('_k'), 2), [CALL('curar', 5, W('* Você bebeu o Refri Sem Gás.', 'Triste, mas doce.'))]),
            (EQ(V('_k'), 3), [IFE(EQ(V('batalha'), 1),
                                  [LADD('textos', W('* Você acende a Vela Misteriosa ao lado do Abajurino.')),
                                   LADD('textos', W('* Agora ele não está mais sozinho contra o escuro.')),
                                   CALL('mudar sat', 50), S('resposta', 'U-uma amiga luminosa! E ela nem pisca!')],
                                  [CALL('curar', 12, W('* Você acendeu a Vela Misteriosa.', 'O calorzinho te conforta.'))])]),
            (EQ(V('_k'), 4), [CALL('curar', 15, W('* Você comeu o Pão de Queijo.', 'Fofinho por dentro!'))]),
            (EQ(V('_k'), 5), [CALL('curar', 8, W('* Você bebeu o Café Requentado.', 'Amargo... mas acorda.')),
                              S('rapido', 1), LADD('textos', W('* Você se sente ligeiro!', '(Mais rápido no próximo ataque)'))]),
            (EQ(V('_k'), 6), [LADD('textos', J(W('* Você abriu o Biscoito da Sorte. O papel diz:'), '|', ITEM('sortes', RND(1, 4)))),
                              CALL('curar', 6, W('* Croc croc.'))]),
        ]),
        CALL('mostrar', 'inimigo'),
    ])

    # ---- POUPAR / FUGIR ----
    T.define('poupar', [
        C('M_turno', 1),
        IFE(GE(V('M_sat'), 100),
            [S('M_estado', 'poupado'), PLAY('poupar'),
             LADD('textos', J('* VOCÊ POUPOU ', V('M_nome'), '.')), LADD('textos', V('m_poupado')),
             LADD('textos', W('* VOCÊ VENCEU! Ganhou 0 EXP.')), S('res', 'POUPADO'), CALL('mostrar', 'fim')],
            [LADD('textos', J('* VOCÊ TENTA POUPAR ', V('M_nome'), '...')),
             LADD('textos', W('* Mas o nome ainda não está AMARELO.', '* Use AGIR para chegar a 100%.')),
             CALL('mostrar', 'inimigo')]),
    ])
    T.define('fugir', [
        C('M_turno', 1),
        S('_t', ADD(45, MUL(V('M_turno'), 5))), IF(GT(V('_t'), 75), S('_t', 75)),
        IFE(LT(RND(1, 100), V('_t')),
            [S('M_estado', 'fugiu'), PLAY('fuga'), LADD('textos', W('* Você saiu correndo o mais rápido que pôde!')),
             LADD('textos', V('m_fuga')), S('res', 'FUGIU'), CALL('mostrar', 'fim')],
            [PLAY('erro'), LADD('textos', W('* Você tentou fugir...')),
             CHAIN([(EQ(RND(1, 3), 1), [LADD('textos', W('* ...mas tropeçou no tapete.'))]),
                    (EQ(RND(1, 2), 1), [LADD('textos', W('* ...mas a porta estava emperrada.'))])],
                   [LADD('textos', W('* ...mas seu cadarço desamarrou.'))]),
             CALL('mostrar', 'inimigo')]),
    ])

    # ---- ATACAR ----
    T.define('resolver', [
        S('fb_parado', 1), S('fb_t', 0),
        S('_dist', DIV(ABS(SUB(V('fb_x'), 215)), 215)),
        IFE(OR(EQ(A('errou'), 1), GT(V('_dist'), 0.94)),
            [S('fb_res', -1), PLAY('errou'), S('dmg_txt', 'ERROU'), S('dmg_cor', 'cinza'), S('dmg_t', 36)],
            [S('fb_crit', 0),
             IFE(LT(V('_dist'), 0.06), [S('fb_crit', 1), S('_mult', 2.2)], [S('_mult', ADD(0.35, MUL(SUB(1, V('_dist')), 1.45)))]),
             S('fb_res', ROUND(MUL(ADD(V('P_atk'), RND(0, 2)), V('_mult')))),
             IF(LT(V('fb_res'), 1), S('fb_res', 1)),
             PLAY('corte')]),
    ])
    T.define('depois luta', [
        IFE(EQ(V('fb_res'), -1),
            [S('resposta', V('m_miss')), CALL('turno inimigo')],
            [IFE(LT(V('M_hp'), 1),
                 [S('M_estado', 'morto'), PLAY('desfaz'),
                  LADD('textos', V('m_morte')),
                  LADD('textos', J('* VOCÊ VENCEU! GANHOU ', V('M_exp'), ' EXP.')),
                  C('P_exp', V('M_exp')),
                  UNTIL(OR(GT(V('P_lv'), 3), LT(V('P_exp'), ITEM('lvExp', V('P_lv')))),
                        C('P_lv', 1), C('P_max', 4), C('P_hp', 4), C('P_atk', 2), PLAY('lvup'),
                        LADD('textos', J('* SEU LV SUBIU PARA ', V('P_lv'), '!|* HP MÁXIMO E ATAQUE AUMENTARAM.'))),
                  S('res', 'DERROTADO'), CALL('mostrar', 'fim')],
                 [C('M_turno', 1), IF(LT(V('M_raiva'), 3), C('M_raiva', 1)), CALL('mudar sat', -10),
                  S('resposta', ITEM('dores', RND(1, LLEN('dores')))), CALL('turno inimigo')])]),
    ])

    # ---- TURNO DO INIMIGO ----
    T.define('turno inimigo', [
        S('cena', 'fala'), S('fala_n', 0),
        IFE(EQ(V('resposta'), ''),
            [S('_b', 0), IF(GE(V('M_sat'), 33), S('_b', 1)), IF(GE(V('M_sat'), 66), S('_b', 2)), IF(GE(V('M_sat'), 100), S('_b', 3)),
             S('fala', ITEM('falas', ADD(MUL(V('_b'), 3), RND(1, 3))))],
            [S('fala', V('resposta'))]),
        S('resposta', ''),
    ])
    T.define('iniciar desvio', [
        S('padrao', ITEM('padroes', RND(1, LLEN('padroes')))),
        UNTIL(NOT(EQ(V('padrao'), V('ultimo'))), S('padrao', ITEM('padroes', RND(1, LLEN('padroes'))))),
        S('ultimo', V('padrao')),
        S('taxa', MUL(ADD(1, MUL(V('M_raiva'), 0.2)), SUB(1, MUL(V('M_sat'), 0.003)))),
        IF(LT(V('taxa'), 0.65), S('taxa', 0.65)), IF(GT(V('taxa'), 1.7), S('taxa', 1.7)),
        CHAIN([(EQ(V('padrao'), p), [S('tx1', -w // 2), S('tx2', w // 2), S('ty1', -56), S('ty2', -56 + h), S('dur', d)])
               for p, (w, h, d) in PADROES.items()]),
        IFE(EQ(V('padrao'), 'grampos'), [S('alma_modo', 'pulo')], [S('alma_modo', 'normal')]),
        S('desvio_t', 0), S('iframe', 0), S('acerto', 0), S('cena', 'desvio'),
        BC('desvio'),
    ])
    T.define('levar dano', [
        S('_d', SUB(ADD(V('M_atq'), V('M_raiva')), SUB(V('P_lv'), 1))), IF(LT(V('_d'), 1), S('_d', 1)),
        C('P_hp', MUL(-1, V('_d'))), S('iframe', 30), PLAY('dano'),
        S('fx_txt', J('-', V('_d'))), S('fx_cor', 'vermelho'), S('fx_x', ADD(V('alma_x'), 10)), S('fx_y', ADD(V('alma_y'), 14)), S('fx_t', 24),
        IF(LT(V('P_hp'), 1), S('P_hp', 0), CALL('game over')),
    ])
    T.define('game over', [S('cena', 'gameover'), S('go_t', 0), BC('fim desvio'), PLAY('quebra')])

    T.define('fim batalha', [
        LADD('res_nomes', V('M_nome')), LADD('res_tipos', V('res')),
        IFE(EQ(V('batalha'), 3),
            [S('cena', 'fim'), S('fim_t', 0), S('M_estado', 'nenhum'), PLAY('poupar')],
            [S('P_hp', V('P_max')), S('M_estado', 'nenhum'),
             CHAIN([(EQ(V('batalha'), i + 1),
                     [LADD('textos', t) for t in it['t']] +
                     [IFE(LT(LLEN('inventario'), 6), [LADD('inventario', k)], [LADD('textos', W('* ...mas a mochila estava cheia.'))]) for k in it['itens']])
                    for i, it in enumerate(INTERLUDIOS)]),
             CALL('mostrar', 'proxima')]),
    ])

    # ---- ATUALIZAR (maquina de estados) ----
    def sub_mouse():
        return IF(AND(EQ(V('clique'), 1), GT(MY(), -60), LT(MY(), 40)),
                  S('_col', 1), IF(GT(MX(), 5), S('_col', 2)),
                  S('_row', ADD(FLOOR(DIV(SUB(36, MY()), 22)), 1)),
                  S('_k', ADD(MUL(SUB(V('_row'), 1), 2), V('_col'))),
                  IF(AND(GT(V('_k'), 0), LT(V('_k'), ADD(LLEN('subItens'), 1))), S('subSel', V('_k')), CALL('executar sub'), STOP_THIS()))

    T.define('atualizar', [
        C('quadro', 1),
        C('cx1', MUL(SUB(V('tx1'), V('cx1')), 0.35)), C('cx2', MUL(SUB(V('tx2'), V('cx2')), 0.35)),
        C('cy1', MUL(SUB(V('ty1'), V('cy1')), 0.35)), C('cy2', MUL(SUB(V('ty2'), V('cy2')), 0.35)),
        IF(GT(V('fx_t'), 0), C('fx_t', -1)), IF(GT(V('dmg_t'), 0), C('dmg_t', -1)), IF(GT(V('M_tremor'), 0), C('M_tremor', -1)),
        C('M_hpv', MUL(SUB(V('M_hp'), V('M_hpv')), 0.2)),
        CHAIN([
            (EQ(V('cena'), 'titulo'), [IF(OR(EQ(V('ok'), 1), EQ(V('clique'), 1)), PLAY('selecionar'), CALL('iniciar jogo'))]),
            (EQ(V('cena'), 'texto'), [
                S('_t', ITEM('textos', V('tq_i'))),
                IF(LT(V('tq_n'), LEN(V('_t'))), C('tq_n', 1.5), IF(EQ(MOD(V('quadro'), 3), 0), PLAY('tecla'))),
                IF(OR(EQ(V('ok'), 1), EQ(V('clique'), 1), EQ(V('voltar'), 1)),
                   IFE(LT(V('tq_n'), LEN(V('_t'))), [S('tq_n', LEN(V('_t')))],
                       [IFE(EQ(V('voltar'), 1), [], [C('tq_i', 1), S('tq_n', 0), IF(GT(V('tq_i'), LLEN('textos')), CALL('continuar'))])])),
            ]),
            (EQ(V('cena'), 'menu'), [
                IF(LT(V('flavor_n'), LEN(V('flavor'))), C('flavor_n', 1.5)),
                IF(EQ(V('esq'), 1), PLAY('mover'), C('menuSel', -1), IF(LT(V('menuSel'), 1), S('menuSel', 4))),
                IF(EQ(V('dir'), 1), PLAY('mover'), C('menuSel', 1), IF(GT(V('menuSel'), 4), S('menuSel', 1))),
                IFE(AND(EQ(V('clique'), 1), LT(MY(), -95), GT(MY(), -137)),
                    [S('_k', ADD(FLOOR(DIV(ADD(MX(), 225), 115)), 1)), IF(LT(V('_k'), 1), S('_k', 1)), IF(GT(V('_k'), 4), S('_k', 4)), CALL('escolher', V('_k'))],
                    [IF(EQ(V('ok'), 1), CALL('escolher', V('menuSel')))]),
            ]),
            (EQ(V('cena'), 'sub'), [
                S('_n', LLEN('subItens')),
                IF(AND(EQ(V('esq'), 1), EQ(MOD(V('subSel'), 2), 0)), C('subSel', -1), PLAY('mover')),
                IF(AND(EQ(V('dir'), 1), EQ(MOD(V('subSel'), 2), 1), LT(V('subSel'), V('_n'))), C('subSel', 1), PLAY('mover')),
                IF(AND(EQ(V('cima'), 1), GT(V('subSel'), 2)), C('subSel', -2), PLAY('mover')),
                IF(AND(EQ(V('baixo'), 1), LT(ADD(V('subSel'), 2), ADD(V('_n'), 1))), C('subSel', 2), PLAY('mover')),
                sub_mouse(),
                IF(AND(EQ(V('clique'), 1), LT(MY(), -95), GT(MY(), -137)),
                   S('_k', ADD(FLOOR(DIV(ADD(MX(), 225), 115)), 1)), IF(LT(V('_k'), 1), S('_k', 1)), IF(GT(V('_k'), 4), S('_k', 4)),
                   CALL('escolher', V('_k')), STOP_THIS()),
                IFE(EQ(V('voltar'), 1), [PLAY('mover'), S('cena', 'menu')], [IF(EQ(V('ok'), 1), CALL('executar sub'))]),
            ]),
            (EQ(V('cena'), 'luta'), [
                IFE(EQ(V('fb_parado'), 0),
                    [C('fb_x', 14),
                     CHAIN([(OR(EQ(V('ok'), 1), EQ(V('clique'), 1)), [CALL('resolver', 0)]),
                            (EQ(V('voltar'), 1), [PLAY('mover'), S('cena', 'menu')]),
                            (GT(V('fb_x'), 429), [S('fb_x', 430), CALL('resolver', 1)])])],
                    [C('fb_t', 1),
                     IF(AND(EQ(V('fb_t'), 11), GT(V('fb_res'), 0)),
                        PLAY('golpe'), C('M_hp', MUL(-1, V('fb_res'))), IF(LT(V('M_hp'), 0), S('M_hp', 0)), S('M_tremor', 18),
                        IFE(EQ(V('fb_crit'), 1), [S('dmg_txt', J('CRÍTICO! ', V('fb_res'))), S('dmg_cor', 'amarelo')],
                            [S('dmg_txt', V('fb_res')), S('dmg_cor', 'vermelho')]), S('dmg_t', 36)),
                     IF(OR(AND(EQ(V('fb_res'), -1), GT(V('fb_t'), 27)), GT(V('fb_t'), 45)), CALL('depois luta'))]),
            ]),
            (EQ(V('cena'), 'fala'), [
                IF(LT(V('fala_n'), LEN(V('fala'))), C('fala_n', 1), IF(EQ(MOD(V('quadro'), 3), 0), PLAY('fala'))),
                IF(OR(EQ(V('ok'), 1), EQ(V('clique'), 1)),
                   IFE(LT(V('fala_n'), LEN(V('fala'))), [S('fala_n', LEN(V('fala')))], [CALL('iniciar desvio')])),
            ]),
            (EQ(V('cena'), 'desvio'), [
                C('desvio_t', 1), IF(GT(V('iframe'), 0), C('iframe', -1)),
                IF(EQ(V('acerto'), 1), S('acerto', 0), IF(LT(V('iframe'), 1), CALL('levar dano'))),
                IF(AND(EQ(V('cena'), 'desvio'), GT(V('desvio_t'), ADD(V('dur'), 14))),
                   BC('fim desvio'), S('rapido', 0), CALL('ir menu')),
            ]),
            (EQ(V('cena'), 'gameover'), [
                C('go_t', 1),
                IF(AND(GT(V('go_t'), 66), OR(EQ(V('ok'), 1), EQ(V('clique'), 1))),
                   PLAY('selecionar'), S('P_lv', V('b_lv')), S('P_exp', V('b_exp')), S('P_max', V('b_max')), S('P_atk', V('b_atk')),
                   S('P_hp', V('P_max')), S('rapido', 0), LCLR('inventario'), S('_i', 0),
                   REP(LLEN('inv_bkp'), C('_i', 1), LADD('inventario', ITEM('inv_bkp', V('_i')))),
                   CALL('iniciar batalha', V('batalha'))),
            ]),
            (EQ(V('cena'), 'fim'), [
                C('fim_t', 1),
                IF(AND(GT(V('fim_t'), 30), OR(EQ(V('ok'), 1), EQ(V('clique'), 1))), PLAY('selecionar'), S('cena', 'titulo')),
            ]),
        ]),
    ])

    # ---- DESENHAR ----
    T.define('painel', [
        IF(NOT(EQ(V('M_estado'), 'nenhum')),
           IFE(GE(V('M_sat'), 100), [CALL('escrever', V('M_nome'), -232, 172, 99, 'amarelo', 100)],
               [CALL('escrever', V('M_nome'), -232, 172, 99, 'branco', 100)]),
           CALL('escrever', 'HP', -232, 148, 9, 'cinza', 100),
           PCOL('#6e1c2c'), CALL('barra', -204, 139, 94, 8),
           PCOL('#c8f05a'), CALL('barra', -204, 139, MUL(94, DIV(V('M_hpv'), V('M_max'))), 8),
           CALL('escrever', 'SAT', -232, 128, 9, 'cinza', 100),
           PCOL('#2a2342'), CALL('barra', -192, 119, 82, 8),
           IFE(GE(V('M_sat'), 100), [PCOL('#ffe14d')], [PCOL('#ffc85a')]),
           CALL('barra', -192, 119, MUL(82, DIV(V('M_sat'), 100)), 8),
           S('_b', 0), IF(GE(V('M_sat'), 33), S('_b', 1)), IF(GE(V('M_sat'), 66), S('_b', 2)), IF(GE(V('M_sat'), 100), S('_b', 3)),
           S('_t', ITEM('moods', ADD(V('_b'), 1))),
           IFE(AND(GT(V('M_raiva'), 1), LT(V('M_sat'), 100)),
               [IFE(EQ(V('M_ele'), 1), [S('_t', 'IRRITADO')], [S('_t', 'IRRITADA')]),
                CALL('escrever', J(V('M_sat'), '% ', V('_t')), -232, 108, 99, 'vermelho', 100)],
               [CALL('escrever', J(V('M_sat'), '% ', V('_t')), -232, 108, 99, 'cinza', 100)]),
           IF(GT(V('dmg_t'), 0),
              CALL('escrever', V('dmg_txt'), 82, ADD(150, DIV(SUB(36, V('dmg_t')), 2)), 99, V('dmg_cor'), 150),
              IF(NOT(EQ(V('dmg_txt'), 'ERROU')),
                 PCOL('#3a1020'), CALL('barra', 82, 120, 100, 8),
                 PCOL('#c8f05a'), CALL('barra', 82, 120, MUL(100, DIV(V('M_hpv'), V('M_max'))), 8)))),
        IF(EQ(V('M_estado'), 'nenhum'),
           CALL('centro', J('CAMINHO PARA A BATALHA ', ADD(V('batalha'), 1), ' DE 3'), 0, 120, 'cinza', 100)),
    ])
    T.define('conteudo', [
        CHAIN([
            (EQ(V('cena'), 'texto'), [
                CALL('escrever', ITEM('textos', V('tq_i')), -213, 30, V('tq_n'), 'branco', 100),
                IF(AND(NOT(LT(V('tq_n'), LEN(ITEM('textos', V('tq_i'))))), LT(MOD(V('quadro'), 16), 8)),
                   CALL('escrever', '▼', 205, -44, 1, 'ambar', 100)),
            ]),
            (EQ(V('cena'), 'menu'), [CALL('escrever', V('flavor'), -213, 30, V('flavor_n'), 'branco', 100)]),
            (EQ(V('cena'), 'sub'), [
                S('_k', 0),
                REP(LLEN('subItens'), C('_k', 1),
                    S('_col', MOD(SUB(V('_k'), 1), 2)), S('_row', FLOOR(DIV(SUB(V('_k'), 1), 2))),
                    S('_lx', ADD(-210, MUL(V('_col'), 220))), S('_ly', SUB(30, MUL(V('_row'), 22))),
                    IF(EQ(V('_k'), V('subSel')), CALL('escrever', '♥', V('_lx'), V('_ly'), 1, 'vermelho', 100)),
                    IFE(AND(EQ(V('subTipo'), 'poupar'), EQ(V('_k'), 1), GE(V('M_sat'), 100)),
                        [CALL('escrever', ITEM('subItens', V('_k')), ADD(V('_lx'), 16), V('_ly'), 99, 'amarelo', 100)],
                        [CALL('escrever', ITEM('subItens', V('_k')), ADD(V('_lx'), 16), V('_ly'), 99, 'branco', 100)])),
                IF(EQ(V('subTipo'), 'item'),
                   CALL('escrever', ITEM('itemDescs', ITEM('inventario', V('subSel'))), -213, -36, 99, 'cinza', 100)),
                IF(EQ(V('subTipo'), 'poupar'),
                   IFE(GE(V('M_sat'), 100), [CALL('escrever', 'O NOME ESTÁ AMARELO: DÁ PARA POUPAR!', -213, -36, 99, 'amarelo', 100)],
                       [CALL('escrever', J('SATISFAÇÃO: ', V('M_sat'), '%  (PRECISA DE 100%)'), -213, -36, 99, 'cinza', 100)])),
            ]),
            (EQ(V('cena'), 'luta'), [
                PCOL('#2a1d45'), CALL('barra', -215, -10, 430, 64),
                PCOL('#4a2c5a'), CALL('barra', -120, -10, 240, 56),
                PCOL('#d9874a'), CALL('barra', -50, -10, 100, 48),
                PCOL('#ffe28a'), CALL('barra', -14, -10, 28, 40),
                PCOL('#ffffff'), PSIZE(2), PUP(), GOTO(0, 18), PDOWN(), GOTO(0, -38), PUP(),
                IFE(AND(EQ(V('fb_parado'), 1), LT(MOD(V('fb_t'), 4), 2)), [PCOL('#ffc85a')], [PCOL('#ffffff')]),
                PSIZE(8), GOTO(SUB(V('fb_x'), 215), 26), PDOWN(), GOTO(SUB(V('fb_x'), 215), -46), PUP(),
                IF(EQ(V('fb_parado'), 0), CALL('centro', 'APERTE Z NO CENTRO DA BARRA!', 0, 60, 'ambar', 100)),
            ]),
            (EQ(V('cena'), 'fala'), [CALL('escrever', J('* ', V('M_nome'), ' ESTÁ FALANDO...'), -213, 30, 99, 'cinza', 100)]),
            (EQ(V('cena'), 'desvio'), [
                PCOL('#3a3450'), CALL('barra', V('cx1'), SUB(V('cy1'), 6), SUB(V('cx2'), V('cx1')), 3),
                PCOL('#f4ead2'),
                CALL('barra', V('cx1'), SUB(V('cy1'), 6), MUL(SUB(V('cx2'), V('cx1')), SUB(1, DIV(SUB(V('desvio_t'), 14), V('dur')))), 3),
                IF(EQ(V('padrao'), 'ondas'),
                   CALL('escrever', 'AZUL: PARADO', -160, 66, 99, 'azul', 100),
                   CALL('escrever', 'LARANJA: MEXA-SE', 0, 66, 99, 'laranja', 100)),
                IF(EQ(V('padrao'), 'grampos'), CALL('centro', 'APERTE CIMA PARA PULAR!', 0, 66, 'verde', 100)),
                IF(EQ(V('rapido'), 1), CALL('escrever', 'LIGEIRO!', 130, -48, 99, 'ambar', 100)),
            ]),
        ]),
    ])
    T.define('status', [
        CALL('escrever', 'VOCÊ', -225, -68, 99, 'branco', 100),
        CALL('escrever', J('LV ', V('P_lv')), -165, -68, 99, 'branco', 100),
        CALL('escrever', 'HP', -100, -68, 99, 'branco', 100),
        S('_w', MUL(V('P_max'), 2.5)),
        PCOL('#6e1c2c'), CALL('barra', -72, -78, V('_w'), 14),
        PCOL('#ffc85a'), CALL('barra', -72, -78, MUL(V('_w'), DIV(V('P_hp'), V('P_max'))), 14),
        CALL('escrever', J(V('P_hp'), ' / ', V('P_max')), ADD(-64, V('_w')), -68, 99, 'branco', 100),
        IF(LT(V('P_lv'), 4), S('_t', J('EXP ', V('P_exp'), '/', ITEM('lvExp', V('P_lv')))),
           CALL('escrever', V('_t'), SUB(226, MUL(LEN(V('_t')), 12)), -68, 99, 'cinza', 100)),
    ])
    nomes_btn = ['ATACAR', 'AGIR', 'ITEM', 'POUPAR']
    btn_body = [S('_b', OR(EQ(V('cena'), 'menu'), EQ(V('cena'), 'sub')))]
    for i, nome in enumerate(nomes_btn):
        x1 = -225 + i * 115
        sel = AND(EQ(V('_b'), 'true'), EQ(V('menuSel'), i + 1))
        lbl_x = x1 + (104 - len(nome) * 12) // 2 + 1
        color_normal = IFE(EQ(V('_b'), 'true'), [S('_c', 'branco')], [S('_c', 'cinza')])
        extra = []
        if i == 3:
            extra = [IF(AND(EQ(V('_b'), 'true'), GE(V('M_sat'), 100)), S('_c', 'amarelo'))]
        btn_body += [
            PSIZE(3),
            IFE(sel, [PCOL('#ffc85a')], [IFE(EQ(V('_b'), 'true'), [PCOL('#f4ead2')], [PCOL('#5d5577')])]),
            CALL('ret', x1, -100, x1 + 104, -132),
            IFE(sel,
                [CALL('escrever', '♥', x1 + 6, -107, 1, 'vermelho', 100), CALL('escrever', nome, x1 + 22, -107, 99, 'ambar', 100)],
                [color_normal] + extra + [CALL('escrever', nome, lbl_x, -107, 99, V('_c'), 100)]),
        ]
    T.define('botoes', btn_body)
    T.define('tela titulo', [
        CALL('centro', 'A NOITE', 0, 160, 'ambar', 300),
        CALL('centro', 'DOS OBJETOS', 0, 100, 'branco', 200),
        CALL('centro', 'UM RPG DE TURNOS COM DESVIOS', 0, 56, 'cinza', 100),
        CALL('centro', '♥', 0, 30, 'vermelho', 150),
        CALL('centro', 'ATACAR: ACERTE O CENTRO DA BARRA', 0, 2, 'branco', 100),
        CALL('centro', 'AGIR: DEIXE O MONSTRO SATISFEITO', 0, -20, 'branco', 100),
        CALL('centro', '100% DE SATISFAÇÃO: POUPAR', 0, -42, 'branco', 100),
        CALL('centro', 'NO TURNO DELE: DESVIE COM A ALMA', 0, -64, 'branco', 100),
        CALL('centro', 'SETAS: MOVER   Z: OK   X: VOLTAR', 0, -100, 'cinza', 100),
        IF(LT(MOD(V('quadro'), 30), 18), CALL('centro', 'APERTE Z OU CLIQUE PARA COMEÇAR', 0, -140, 'ambar', 100)),
    ])
    T.define('tela gameover', [
        IF(GT(V('go_t'), 40),
           CALL('centro', 'FIM DE JOGO', 0, 110, 'branco', 300),
           CALL('centro', '* NÃO DESISTA!', 0, 40, 'ambar', 100),
           CALL('centro', 'A LUZ AINDA ESTÁ ACESA...', 0, 18, 'ambar', 100),
           CALL('centro', J('BATALHA ', V('batalha'), ' DE 3: ', V('M_nome')), 0, -20, 'cinza', 100),
           IF(AND(GT(V('go_t'), 66), LT(MOD(V('quadro'), 30), 18)),
              CALL('centro', 'APERTE Z PARA TENTAR DE NOVO', 0, -120, 'branco', 100))),
    ])
    T.define('tela fim', [
        S('_k', 0), S('_n', 0), S('_d', 0), S('_i', 0),
        REP(LLEN('res_tipos'), C('_i', 1),
            IF(EQ(ITEM('res_tipos', V('_i')), 'POUPADO'), C('_k', 1)),
            IF(EQ(ITEM('res_tipos', V('_i')), 'DERROTADO'), C('_n', 1)),
            IF(EQ(ITEM('res_tipos', V('_i')), 'FUGIU'), C('_d', 1))),
        S('_tit', 'SOBREVIVENTE DA NOITE'), S('_t', W('* Os objetos voltaram a ser só objetos...', 'ou não?')),
        IF(EQ(V('_k'), 3), S('_tit', 'PACIFISTA DA MADRUGADA'), S('_t', W('* Os objetos da casa agora deixam um copo d\'água no seu criado-mudo.'))),
        IF(EQ(V('_n'), 3), S('_tit', 'TERROR DOS ELETRODOMÉSTICOS'), S('_t', W('* A casa está silenciosa.', 'Silenciosa demais.'))),
        IF(EQ(V('_d'), 3), S('_tit', 'MARATONISTA NOTURNO'), S('_t', W('* Você correu a noite inteira.', 'Pelo menos fez cardio.'))),
        CALL('centro', 'A NOITE ACABOU', 0, 160, 'branco', 200),
        CALL('centro', 'SEU TÍTULO:', 0, 118, 'cinza', 100),
        IFE(EQ(V('_k'), 3), [CALL('centro', V('_tit'), 0, 96, 'amarelo', 100)], [CALL('centro', V('_tit'), 0, 96, 'ambar', 100)]),
        S('_li', 0),
        REP(LLEN('res_nomes'), C('_li', 1),
            S('_ly', SUB(56, MUL(V('_li'), 24))),
            CALL('escrever', ITEM('res_nomes', V('_li')), -150, V('_ly'), 99, 'branco', 100),
            S('_lc', ITEM('res_tipos', V('_li'))),
            IFE(EQ(V('_lc'), 'POUPADO'), [CALL('escrever', V('_lc'), 50, V('_ly'), 99, 'amarelo', 100)],
                [IFE(EQ(V('_lc'), 'DERROTADO'), [CALL('escrever', V('_lc'), 50, V('_ly'), 99, 'vermelho', 100)],
                     [CALL('escrever', V('_lc'), 50, V('_ly'), 99, 'cinza', 100)])])),
        CALL('centro', J('LV FINAL: ', V('P_lv'), '    EXP: ', V('P_exp')), 0, -46, 'branco', 100),
        CALL('escrever', V('_t'), -204, -76, 999, 'cinza', 100),
        IF(AND(GT(V('fim_t'), 30), LT(MOD(V('quadro'), 30), 18)), CALL('centro', 'APERTE Z PARA JOGAR DE NOVO', 0, -150, 'ambar', 100)),
    ])
    T.define('desenhar', [
        PCLEAR(),
        CHAIN([
            (EQ(V('cena'), 'titulo'), [CALL('tela titulo')]),
            (EQ(V('cena'), 'gameover'), [CALL('tela gameover')]),
            (EQ(V('cena'), 'fim'), [CALL('tela fim')]),
        ], [
            CALL('painel'),
            PSIZE(3), PCOL('#f4ead2'), CALL('ret', V('cx1'), V('cy1'), V('cx2'), V('cy2')),
            CALL('conteudo'), CALL('status'), CALL('botoes'),
            IF(GT(V('fx_t'), 0), CALL('escrever', V('fx_txt'), V('fx_x'), ADD(V('fx_y'), DIV(SUB(30, V('fx_t')), 1.5)), 99, V('fx_cor'), 150)),
        ]),
    ])
    T.script(FLAG(), [
        S('cena', 'titulo'), S('quadro', 0), S('M_estado', 'nenhum'), S('batalha', 0),
        S('cx1', -225), S('cx2', 225), S('cy1', -60), S('cy2', 40), CALL('caixa menu'),
        COST('vazio'), SHOW(), CLREFF(), PUP(), BC('fim desvio'),
        S('k_ok', 1), S('k_m', 1),
        FOREVER(CALL('ler teclas'), CALL('atualizar'), CALL('desenhar')),
    ])

    # ================= SPRITE ALMA =================
    AL = Target(P, 'Alma')
    AL.costumes = [costume('vermelha', svg_doc(13, 12, heart_path('#ff4f6d', 0.8)), 6.5, 6),
                   costume('verde', svg_doc(13, 12, heart_path('#5affb0', 0.8)), 6.5, 6),
                   costume('partida', svg_doc(13, 12, heart_path('#ff4f6d', 0.8) + '<path d="M6.4 3 L5 6 L7.4 8 L6 11.5" stroke="#07060f" stroke-width="1.4" fill="none"/>'), 6.5, 6)]
    for n in ['vy', 'chao', 'ox', 'oy', 'dx', 'dy', 'vel', 'pul']:
        AL.var(n, 0)
    AL.script(FLAG(), [HIDE(), ROTSTYLE("don't rotate"), POINT(90),
        FOREVER(CHAIN([
            (EQ(V('cena'), 'desvio'), [
                SHOW(), FRONT(),
                IFE(EQ(V('alma_modo'), 'pulo'), [COST('verde')], [COST('vermelha')]),
                IFE(AND(GT(V('iframe'), 0), LT(MOD(V('iframe'), 6), 3)), [EFF('GHOST', 85)], [EFF('GHOST', 0)]),
                S('ox', XPOS()), S('oy', YPOS()),
                IFE(EQ(V('rapido'), 1), [S('vel', 4.9)], [S('vel', 3.75)]),
                S('dx', 0), S('dy', 0), S('pul', 0),
                IF(KEY('right arrow'), C('dx', 1)), IF(KEY('left arrow'), C('dx', -1)),
                IF(KEY('up arrow'), C('dy', 1), S('pul', 1)), IF(KEY('down arrow'), C('dy', -1)),
                IF(AND(MOUSE(), GT(DIST('_mouse_'), 4)),
                   S('dx', DIV(SUB(MX(), XPOS()), DIST('_mouse_'))), S('dy', DIV(SUB(MY(), YPOS()), DIST('_mouse_'))),
                   IF(GT(MY(), ADD(YPOS(), 14)), S('pul', 1))),
                IF(AND(NOT(EQ(V('dx'), 0)), NOT(EQ(V('dy'), 0)), NOT(MOUSE())), S('dx', MUL(V('dx'), 0.71)), S('dy', MUL(V('dy'), 0.71))),
                CHX(MUL(V('dx'), V('vel'))),
                IFE(EQ(V('alma_modo'), 'pulo'),
                    [IF(AND(EQ(V('pul'), 1), EQ(V('chao'), 1)), S('vy', 8.5), S('chao', 0)),
                     IFE(AND(GT(V('vy'), 0), EQ(V('pul'), 0)), [C('vy', -1.75)], [C('vy', -0.8)]),
                     CHY(V('vy')),
                     IF(LT(YPOS(), ADD(V('cy1'), 8)), SETY(ADD(V('cy1'), 8)), S('vy', 0), S('chao', 1))],
                    [CHY(MUL(V('dy'), V('vel')))]),
                IF(LT(XPOS(), ADD(V('cx1'), 8)), SETX(ADD(V('cx1'), 8))),
                IF(GT(XPOS(), SUB(V('cx2'), 8)), SETX(SUB(V('cx2'), 8))),
                IF(LT(YPOS(), ADD(V('cy1'), 8)), SETY(ADD(V('cy1'), 8))),
                IF(GT(YPOS(), SUB(V('cy2'), 8)), SETY(SUB(V('cy2'), 8)), IF(GT(V('vy'), 0), S('vy', 0))),
                IFE(GT(ADD(ABS(SUB(XPOS(), V('ox'))), ABS(SUB(YPOS(), V('oy')))), 0.3), [S('alma_movendo', 1)], [S('alma_movendo', 0)]),
                S('alma_x', XPOS()), S('alma_y', YPOS()),
            ]),
            (EQ(V('cena'), 'gameover'), [
                EFF('GHOST', 0),
                CHAIN([(LT(V('go_t'), 16), [SHOW(), COST('vermelha')]), (LT(V('go_t'), 36), [SHOW(), COST('partida')])], [HIDE()]),
            ]),
        ], [HIDE()])),
    ])
    AL.script(WHEN('desvio'), [
        S('vy', 0), S('chao', 0),
        GOTO(0, DIV(ADD(V('ty1'), V('ty2')), 2)),
        IF(EQ(V('alma_modo'), 'pulo'), SETY(ADD(V('ty1'), 8))),
        IF(EQ(V('padrao'), 'prazo'), GOTO(ADD(V('tx1'), 14), SUB(V('ty2'), 14))),
        S('alma_x', XPOS()), S('alma_y', YPOS()),
    ])

    # ================= SPRITE MONSTRO =================
    MO = Target(P, 'Monstro')
    MO.costumes = [costume('abaj_1', svg_abaj(False), 120, 88), costume('abaj_2', svg_abaj(True), 120, 88),
                   costume('tost_1', svg_tost(False), 120, 62), costume('tost_2', svg_tost(True), 120, 62),
                   costume('gram_1', svg_gram(False), 128, 95), costume('gram_2', svg_gram(True), 128, 95)]
    for n in ['_s', '_i', '_dito']:
        MO.var(n, 0)
    MO.declare('parcial', [])
    MO.define('parcial', [
        S('_s', ''), S('_i', 0),
        REP(V('fala_n'), C('_i', 1), S('_s', J(V('_s'), LETTER(V('_i'), V('fala'))))),
    ])
    MO.script(FLAG(), [HIDE(), ROTSTYLE("don't rotate"), SIZE(80), S('_dito', ''),
        FOREVER(
            IFE(OR(EQ(V('M_estado'), 'nenhum'), EQ(V('cena'), 'titulo'), EQ(V('cena'), 'fim'), EQ(V('cena'), 'gameover')),
                [HIDE(), IF(NOT(EQ(V('_dito'), '')), SAY(''), S('_dito', ''))],
                [SHOW(),
                 IFE(LT(V('M_sat'), 66), [COST(J(V('M_pref'), '_1'))], [COST(J(V('M_pref'), '_2'))]),
                 CHAIN([(EQ(V('M_estado'), 'vivo'), [CHEFF('GHOST', -6)]),
                        (EQ(V('M_estado'), 'morto'), [CHEFF('GHOST', 3)]),
                        (EQ(V('M_estado'), 'poupado'), [EFF('GHOST', 45)]),
                        (EQ(V('M_estado'), 'fugiu'), [CHEFF('GHOST', 8)])]),
                 IFE(GT(V('M_tremor'), 0), [SETX(MUL(SIN(MUL(V('M_tremor'), 120)), DIV(V('M_tremor'), 2)))], [SETX(0)]),
                 SETY(ADD(104, MUL(3, SIN(MUL(TIMER(), 140))))),
                 IFE(AND(EQ(V('cena'), 'fala'), GT(V('fala_n'), 0)),
                     [CALL('parcial'), IF(NOT(EQ(V('_s'), V('_dito'))), SAY(V('_s')), S('_dito', V('_s')))],
                     [IF(NOT(EQ(V('_dito'), '')), SAY(''), S('_dito', ''))])])),
    ])
    MO.script(WHEN('nova batalha'), [EFF('GHOST', 100)])

    # ================= SPRITE BALA (ataques) =================
    BA = Target(P, 'Bala')
    BA.costumes = [costume('vazio', svg_doc(2, 2, ''), 1, 1)] + bala_costumes()
    for n in ['clone', 'tipo', 'vx', 'vy', 'g', 'vida', 'aviso', 't', 'kind', 'giro', 'vel', 'cativo', 'acc1', 'acc2', 'pt',
              'n', 'k', 'yy', 'lado', 'gap', 'iv']:
        BA.var(n, 0)
    bprocs = {'base': ['tipo', 'cost'], 'soltar': [], 'borda': [], 'p mariposa': [], 'p filamento': [], 'p faisca': [],
              'p feixe': [], 'p torrada': [], 'p migalha': ['grande'], 'p onda': [], 'p grampo': [], 'p papelada': [],
              'p prazo': [], 'p carimbo': [], 'ativar': []}
    for n, ps in bprocs.items():
        BA.declare(n, ps)
    BA.define('base', [
        S('tipo', A('tipo')), COST(A('cost')), S('vx', 0), S('vy', 0), S('g', 0), S('vida', 200), S('aviso', 0),
        S('kind', 0), S('giro', 0), S('vel', 0), S('cativo', ''), POINT(90), CLREFF(),
    ])
    BA.define('soltar', [CLONE()])
    # ponto aleatorio na borda da caixa
    BA.define('borda', [
        S('lado', RND(1, 4)),
        CHAIN([(EQ(V('lado'), 1), [GOTO(SUB(V('tx1'), 8), RND(V('ty1'), V('ty2')))]),
               (EQ(V('lado'), 2), [GOTO(ADD(V('tx2'), 8), RND(V('ty1'), V('ty2')))]),
               (EQ(V('lado'), 3), [GOTO(RND(V('tx1'), V('tx2')), ADD(V('ty2'), 8))])],
              [GOTO(RND(V('tx1'), V('tx2')), SUB(V('ty1'), 8))]),
    ])
    BA.define('p mariposa', [CALL('base', 'mariposa', 'mariposa'), CALL('borda'), TOWARD('Alma'),
                             S('vel', MUL(2, V('taxa'))), S('vida', 200), CALL('soltar')])
    BA.define('p filamento', [CALL('base', 'filamento', 'aviso_col'),
                              IFE(LT(RND(1, 100), 35), [S('k', ADD(V('alma_x'), RND(-15, 15)))], [S('k', RND(ADD(V('tx1'), 6), SUB(V('tx2'), 6)))]),
                              IF(LT(V('k'), ADD(V('tx1'), 6)), S('k', ADD(V('tx1'), 6))), IF(GT(V('k'), SUB(V('tx2'), 6)), S('k', SUB(V('tx2'), 6))),
                              GOTO(V('k'), DIV(ADD(V('ty1'), V('ty2')), 2)),
                              S('aviso', 15), S('cativo', 'filamento'), S('vel', MUL(-10, V('taxa'))), S('vida', 60), CALL('soltar')])
    BA.define('p faisca', [CALL('base', 'faisca', 'faisca'),
                           GOTO(RND(ADD(V('tx1'), 10), SUB(V('tx2'), 10)), RND(ADD(V('ty1'), 10), SUB(V('ty2'), 10))),
                           IF(LT(DIST('Alma'), 45), GOTO(SUB(0, XPOS()), SUB(ADD(V('ty1'), V('ty2')), YPOS()))),
                           S('k', RND(0, 359)), S('vx', MUL(MUL(MATH('cos', V('k')), RND(2, 3)), V('taxa'))),
                           S('vy', MUL(MUL(SIN(V('k')), RND(2, 3)), V('taxa'))), S('aviso', 12), S('vida', 999), CALL('soltar')])
    BA.define('p feixe', [
        IFE(LT(RND(1, 100), 50),
            [CALL('base', 'feixe', 'aviso_h'), S('cativo', 'feixe_h'), S('k', ADD(V('alma_y'), RND(-10, 10))),
             IF(LT(V('k'), ADD(V('ty1'), 8)), S('k', ADD(V('ty1'), 8))), IF(GT(V('k'), SUB(V('ty2'), 8)), S('k', SUB(V('ty2'), 8))),
             GOTO(0, V('k'))],
            [CALL('base', 'feixe', 'aviso_v'), S('cativo', 'feixe_v'), S('k', ADD(V('alma_x'), RND(-10, 10))),
             IF(LT(V('k'), ADD(V('tx1'), 8)), S('k', ADD(V('tx1'), 8))), IF(GT(V('k'), SUB(V('tx2'), 8)), S('k', SUB(V('tx2'), 8))),
             GOTO(V('k'), DIV(ADD(V('ty1'), V('ty2')), 2))]),
        S('aviso', 19), S('vida', 29), CALL('soltar')])
    BA.define('p torrada', [CALL('base', 'torrada', 'torrada'), GOTO(RND(ADD(V('tx1'), 15), SUB(V('tx2'), 15)), SUB(V('ty1'), 10)),
                            S('vx', RND(-1.4, 1.4)), S('vy', MUL(RND(7.6, 9.2), V('taxa'))), S('g', MUL(-0.43, MUL(V('taxa'), V('taxa')))),
                            S('giro', RND(-7, 7)), S('vida', 100), CALL('soltar')])
    BA.define('p migalha', [
        IFE(EQ(A('grande'), 1),
            [CALL('base', 'migalha', 'migalha_g'), GOTO(ADD(V('alma_x'), RND(-20, 20)), SUB(V('ty2'), 4)), S('vy', MUL(-3.75, V('taxa')))],
            [CALL('base', 'migalha', 'migalha'), GOTO(RND(SUB(V('tx1'), 40), V('tx2')), SUB(V('ty2'), 3)),
             S('vx', RND(0.6, 1.4)), S('vy', MUL(RND(-4.1, -2.7), V('taxa')))]),
        S('vida', 90), CALL('soltar')])
    BA.define('p onda', [
        IFE(LT(RND(1, 100), 50), [CALL('base', 'onda', 'onda_azul'), S('kind', 1)], [CALL('base', 'onda', 'onda_laranja'), S('kind', 2)]),
        IFE(LT(RND(1, 100), 50), [GOTO(SUB(V('tx1'), 4), DIV(ADD(V('ty1'), V('ty2')), 2)), S('vx', MUL(4.1, V('taxa')))],
            [GOTO(ADD(V('tx2'), 4), DIV(ADD(V('ty1'), V('ty2')), 2)), S('vx', MUL(-4.1, V('taxa')))]),
        S('vida', 90), CALL('soltar')])
    BA.define('p grampo', [
        IFE(LT(RND(1, 100), 28),
            [CALL('base', 'grampo', 'grampo_voo'), GOTO(ADD(V('tx2'), 10), ADD(V('ty1'), RND(34, 44))), S('vx', MUL(-5.75, V('taxa')))],
            [IFE(LT(RND(1, 100), 50), [CALL('base', 'grampo', 'grampo_p'), GOTO(ADD(V('tx2'), 8), ADD(V('ty1'), 8))],
                 [CALL('base', 'grampo', 'grampo_g'), GOTO(ADD(V('tx2'), 8), ADD(V('ty1'), 13))]),
             S('vx', MUL(RND(-5.6, -4.5), V('taxa')))]),
        S('vida', 90), CALL('soltar')])
    BA.define('p papelada', [
        S('lado', RND(1, 2)), S('gap', RND(ADD(V('ty1'), 24), SUB(V('ty2'), 24))), S('yy', ADD(V('ty1'), 8)),
        REP(8, IF(AND(LT(V('yy'), SUB(V('ty2'), 4)), GT(ABS(SUB(V('yy'), V('gap'))), 22)),
                  CALL('base', 'papel', 'papel'),
                  IFE(EQ(V('lado'), 1), [GOTO(SUB(V('tx1'), 10), V('yy')), S('vx', MUL(3.1, V('taxa')))],
                      [GOTO(ADD(V('tx2'), 10), V('yy')), S('vx', MUL(-3.1, V('taxa')))]),
                  S('vida', 100), CALL('soltar')),
            C('yy', 16)),
    ])
    BA.define('p prazo', [
        CALL('base', 'ponteiro', 'ponteiro_a'), GOTO(0, DIV(ADD(V('ty1'), V('ty2')), 2)), POINT(0),
        S('aviso', 27), S('vel', MUL(2.4, V('taxa'))), S('vida', 999), CALL('soltar'),
        CALL('base', 'ponteiro', 'ponteiro_b'), GOTO(0, DIV(ADD(V('ty1'), V('ty2')), 2)), POINT(135),
        S('aviso', 27), S('vel', MUL(-1.5, V('taxa'))), S('vida', 999), CALL('soltar'),
        CALL('base', 'ponteiro', 'eixo'), GOTO(0, DIV(ADD(V('ty1'), V('ty2')), 2)), S('aviso', 27), S('vida', 999), CALL('soltar'),
    ])
    BA.define('p carimbo', [
        CALL('base', 'carimbo', 'alvo'), S('cativo', 'carimbo'),
        S('k', V('alma_x')), S('yy', V('alma_y')),
        IF(LT(V('k'), ADD(V('tx1'), 18)), S('k', ADD(V('tx1'), 18))), IF(GT(V('k'), SUB(V('tx2'), 18)), S('k', SUB(V('tx2'), 18))),
        IF(LT(V('yy'), ADD(V('ty1'), 18)), S('yy', ADD(V('ty1'), 18))), IF(GT(V('yy'), SUB(V('ty2'), 18)), S('yy', SUB(V('ty2'), 18))),
        GOTO(V('k'), V('yy')), S('aviso', 19), S('vida', 31), CALL('soltar'),
    ])
    BA.define('ativar', [
        IF(NOT(EQ(V('cativo'), '')), COST(V('cativo'))), EFF('GHOST', 0),
        IF(EQ(V('tipo'), 'filamento'), SETY(SUB(V('ty2'), 6)), S('vy', V('vel'))),
        IF(EQ(V('tipo'), 'ponteiro'), S('giro', V('vel'))),
    ])

    def every(acc, interval_expr, body):
        return [C(acc, V('taxa')), IF(NOT(LT(V(acc), interval_expr)), C(acc, MUL(-1, interval_expr)), *body)]

    spawn_loop = CHAIN([
        (EQ(V('padrao'), 'mariposas'), every('acc1', 13, [CALL('p mariposa')])),
        (EQ(V('padrao'), 'filamentos'), every('acc1', 11, [CALL('p filamento')])),
        (EQ(V('padrao'), 'apagao'), every('acc1', 33, [IF(LT(V('n'), 9), C('n', 1), CALL('p faisca'))])),
        (EQ(V('padrao'), 'feixes'), every('acc1', 24, [CALL('p feixe')])),
        (EQ(V('padrao'), 'torradas'), every('acc1', 14, [CALL('p torrada')])),
        (EQ(V('padrao'), 'migalhas'), every('acc1', 2.6, [CALL('p migalha', 0)]) + every('acc2', 35, [CALL('p migalha', 1)])),
        (EQ(V('padrao'), 'ondas'), every('acc1', 22, [CALL('p onda')])),
        (EQ(V('padrao'), 'grampos'), every('acc1', V('iv'), [CALL('p grampo'), S('iv', RND(18, 28))])),
        (EQ(V('padrao'), 'papelada'), every('acc1', 32, [CALL('p papelada')])),
        (EQ(V('padrao'), 'carimbos'), every('acc1', 23, [CALL('p carimbo')])),
    ])
    BA.script(FLAG(), [HIDE(), S('clone', 0), ROTSTYLE('all around')])
    BA.script(WHEN('desvio'), [
        IF(EQ(V('clone'), 0),
           HIDE(), S('acc1', 9), S('acc2', 0), S('n', 0), S('pt', 0), S('iv', 22),
           REP(14),
           IF(EQ(V('padrao'), 'apagao'), REP(5, C('n', 1), CALL('p faisca'))),
           IF(EQ(V('padrao'), 'prazo'), CALL('p prazo')),
           UNTIL(NOT(EQ(V('cena'), 'desvio')), C('pt', 1), spawn_loop)),
    ])
    BA.script(WHEN('fim desvio'), [IF(EQ(V('clone'), 1), DELCLONE())])
    BA.script(CLONEHAT(), [
        S('clone', 1), S('t', 0),
        IFE(EQ(V('aviso'), 0), [EFF('GHOST', 0)], [IF(OR(EQ(V('tipo'), 'faisca'), EQ(V('tipo'), 'ponteiro')), EFF('GHOST', 60))]),
        UNTIL(NOT(EQ(V('cena'), 'desvio')),
            C('t', 1),
            IF(AND(GT(V('aviso'), 0), EQ(V('t'), ADD(V('aviso'), 1))), CALL('ativar')),
            IF(AND(EQ(V('tipo'), 'feixe'), NOT(GT(V('t'), V('aviso')))),
               IFE(LT(MOD(V('t'), 4), 2), [EFF('GHOST', 0)], [EFF('GHOST', 60)])),
            IFE(EQ(V('tipo'), 'mariposa'),
                [IF(LT(V('t'), 48), TOWARD('Alma')), MOVE(V('vel'))],
                [C('vy', V('g')), CHX(V('vx')), CHY(V('vy'))]),
            IF(NOT(EQ(V('giro'), 0)), TURN(V('giro'))),
            IF(EQ(V('tipo'), 'faisca'),
               IF(LT(XPOS(), ADD(V('tx1'), 5)), S('vx', ABS(V('vx')))), IF(GT(XPOS(), SUB(V('tx2'), 5)), S('vx', MUL(-1, ABS(V('vx'))))),
               IF(LT(YPOS(), ADD(V('ty1'), 5)), S('vy', ABS(V('vy')))), IF(GT(YPOS(), SUB(V('ty2'), 5)), S('vy', MUL(-1, ABS(V('vy'))))),
               IF(GT(V('t'), V('aviso')),
                  IFE(OR(LT(DIST('Alma'), 42), LT(MOD(V('desvio_t'), 51), 4)), [EFF('GHOST', 0)], [EFF('GHOST', 100)]))),
            IF(AND(EQ(V('tipo'), 'carimbo'), GT(V('t'), ADD(V('aviso'), 8))), CHEFF('GHOST', 25)),
            IFE(OR(EQ(V('tipo'), 'ponteiro'),
                   AND(GT(XPOS(), SUB(V('tx1'), 2)), LT(XPOS(), ADD(V('tx2'), 2)), GT(YPOS(), SUB(V('ty1'), 2)), LT(YPOS(), ADD(V('ty2'), 2)))),
                [SHOW()], [HIDE()]),
            IF(AND(OR(EQ(V('aviso'), 0), GT(V('t'), V('aviso'))), NOT(AND(EQ(V('tipo'), 'carimbo'), GT(V('t'), ADD(V('aviso'), 8)))),
                   TOUCH('Alma')),
               IF(OR(EQ(V('kind'), 0), AND(EQ(V('kind'), 1), EQ(V('alma_movendo'), 1)), AND(EQ(V('kind'), 2), EQ(V('alma_movendo'), 0))),
                  S('acerto', 1))),
            IF(OR(GT(V('t'), V('vida')),
                  AND(LT(V('vx'), 0), LT(XPOS(), SUB(V('tx1'), 30))), AND(GT(V('vx'), 0), GT(XPOS(), ADD(V('tx2'), 30))),
                  AND(LT(V('vy'), 0), LT(YPOS(), SUB(V('ty1'), 30)))), DELCLONE())),
        DELCLONE(),
    ])

    # ---- monta ----
    targets = [stage, T, MO, BA, AL]
    js = {'targets': [t.to_json(i) for i, t in enumerate(targets)], 'monitors': [], 'extensions': ['pen'],
          'meta': {'semver': '3.0.0', 'vm': '0.2.0', 'agent': 'gerar_sb3.py'}}
    return js


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'A-Noite-dos-Objetos.sb3')
    js = build()
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('project.json', json.dumps(js, ensure_ascii=False))
        for name, data in ASSETS.items():
            z.writestr(name, data)
    with open(out, 'wb') as f:
        f.write(buf.getvalue())
    nblocks = sum(len(t['blocks']) for t in js['targets'])
    print(f'gerado: {os.path.abspath(out)}  ({nblocks} blocos, {len(ASSETS)} arquivos)')


if __name__ == '__main__':
    main()
