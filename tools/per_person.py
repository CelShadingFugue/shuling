# -*- coding: utf-8 -*-
'''从 docs/工作初步分配.xlsx 的「认领表」生成按人视图（每人一列）。

用法：
    python tools/per_person.py            # 生成 docs/工作初步分配-按人.xlsx
改了认领表里的数字后，重跑一次即可。
'''
import os
import math
import sys

from openpyxl import load_workbook, Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(BASE, 'docs', '工作初步分配.xlsx')
OUT = os.path.join(BASE, 'docs', '工作初步分配-按人.xlsx')

INK = '23262B'
TEAL = '2E6F6A'
TEAL_L = 'EAF2F0'
LINE = 'D9D6CC'
BAND = 'F5F3EE'
GREY = '6B7078'
SOFT = 'FBF7EE'

FONT = '微软雅黑'
thin = Side(style='thin', color=LINE)
BORDER = Border(left=thin, right=thin, top=thin, bottom=thin)

PEOPLE = [(1, '李金峰'), (2, '冯百懋'), (3, '张子涵'), (4, '李美蓉')]


def read_tasks():
    wb = load_workbook(SRC, data_only=True)
    ws = wb['认领表']
    out = []
    for r in range(4, ws.max_row + 1):
        code = ws.cell(row=r, column=1).value
        if not code:
            continue
        raw = ws.cell(row=r, column=8).value
        codes = ''.join(ch for ch in str(raw or '') if ch in '1234')
        out.append({
            'id': str(code).strip(),
            'line': ws.cell(row=r, column=2).value,
            'name': ws.cell(row=r, column=3).value,
            'when': ws.cell(row=r, column=6).value,
            'out': ws.cell(row=r, column=7).value,
            'codes': codes,
        })
    return out


def main():
    tasks = read_tasks()
    buckets = {c: [] for c, _ in PEOPLE}
    for t in tasks:
        for c in t['codes']:
            buckets[int(c)].append(t)
    maxn = max(len(v) for v in buckets.values())

    wb = Workbook()
    ws = wb.active
    ws.title = '按人'
    ws.sheet_view.showGridLines = False

    ws.column_dimensions['A'].width = 5
    for i in range(len(PEOPLE)):
        ws.column_dimensions[get_column_letter(2 + i)].width = 34
    ncol = 1 + len(PEOPLE)
    last_col = get_column_letter(ncol)

    ws.merge_cells('A1:%s1' % last_col)
    c = ws['A1']
    c.value = '按人看：每个人名下有什么'
    c.font = Font(name=FONT, size=16, bold=True, color=INK)
    c.alignment = Alignment(horizontal='left', vertical='center')
    ws.row_dimensions[1].height = 34

    ws.merge_cells('A2:%s2' % last_col)
    c = ws['A2']
    c.value = ('代号来自「认领表」最后一列：1 = 李金峰，2 = 冯百懋，3 = 张子涵，4 = 李美蓉。'
               '同一件事写了几个人，就会同时出现在几列里；只在一个人名下的是「独担」。')
    c.font = Font(name=FONT, size=9, color=GREY)
    c.alignment = Alignment(horizontal='left', vertical='center')
    ws.row_dimensions[2].height = 20

    h = ws.cell(row=3, column=1, value='#')
    h.font = Font(name=FONT, size=10, bold=True, color='FFFFFF')
    h.fill = PatternFill('solid', fgColor=TEAL)
    h.alignment = Alignment(horizontal='center', vertical='center')
    h.border = BORDER

    for i, (code, name) in enumerate(PEOPLE):
        cell = ws.cell(row=3, column=2 + i, value='%s　·　%d 项' % (name, len(buckets[code])))
        cell.font = Font(name=FONT, size=11, bold=True, color='FFFFFF')
        cell.fill = PatternFill('solid', fgColor=TEAL)
        cell.alignment = Alignment(horizontal='center', vertical='center')
        cell.border = BORDER
    ws.row_dimensions[3].height = 30

    r = 4
    for i in range(maxn):
        idx = ws.cell(row=r, column=1, value=i + 1)
        idx.font = Font(name=FONT, size=9, color=GREY)
        idx.alignment = Alignment(horizontal='center', vertical='top')
        idx.border = BORDER

        maxlines = 1
        for j, (code, name) in enumerate(PEOPLE):
            cell = ws.cell(row=r, column=2 + j)
            cell.border = BORDER
            cell.alignment = Alignment(horizontal='left', vertical='top', wrap_text=True)
            cell.fill = PatternFill('solid', fgColor=BAND if i % 2 else 'FFFFFF')
            if i < len(buckets[code]):
                t = buckets[code][i]
                cell.value = '%s　%s\n%s · %s' % (t['id'], t['name'], t['when'], t['out'])
                l1 = len('%s　%s' % (t['id'], t['name']))
                l2 = len('%s · %s' % (t['when'], t['out']))
                maxlines = max(maxlines, math.ceil(l1 / 16.0) + math.ceil(l2 / 16.0))
        ws.row_dimensions[r].height = max(34, 16 * maxlines + 22)
        r += 1

    # 合计
    ws.cell(row=r, column=1, value='').border = BORDER
    for j, (code, name) in enumerate(PEOPLE):
        own = sum(1 for t in buckets[code] if len(t['codes']) == 1)
        share = len(buckets[code]) - own
        cell = ws.cell(row=r, column=2 + j,
                       value='独担 %d　共担 %d　合计 %d' % (own, share, len(buckets[code])))
        cell.font = Font(name=FONT, size=10, bold=True, color=TEAL)
        cell.fill = PatternFill('solid', fgColor=TEAL_L)
        cell.alignment = Alignment(horizontal='center', vertical='center')
        cell.border = BORDER
    ws.row_dimensions[r].height = 26

    # 共担清单
    r += 2
    ws.merge_cells('A%d:%s%d' % (r, last_col, r))
    c = ws.cell(row=r, column=1)
    c.value = '共担的事（写了几个人，谁都不能当“没人管”）'
    c.font = Font(name=FONT, size=10, bold=True, color=GREY)
    c.alignment = Alignment(horizontal='left', vertical='center')
    r += 1

    for t in tasks:
        if len(t['codes']) < 2:
            continue
        who = '、'.join(n for c2, n in PEOPLE if str(c2) in t['codes'])
        ws.cell(row=r, column=1, value='').border = BORDER
        cell = ws.cell(row=r, column=2, value='%s　%s　—　%s' % (t['id'], t['name'], who))
        ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=ncol)
        cell.font = Font(name=FONT, size=10, color=INK)
        cell.alignment = Alignment(horizontal='left', vertical='center', wrap_text=True)
        cell.border = BORDER
        cell.fill = PatternFill('solid', fgColor=SOFT)
        ws.row_dimensions[r].height = 22
        r += 1

    ws.freeze_panes = 'B4'
    ws.page_setup.orientation = 'landscape'
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0
    ws.sheet_properties.pageSetUpPr.fitToPage = True

    wb.save(OUT)
    print('saved', OUT)
    for c, n in PEOPLE:
        own = sum(1 for t in buckets[c] if len(t['codes']) == 1)
        print(' %s  独担 %d / 共担 %d / 合计 %d' % (n, own, len(buckets[c]) - own, len(buckets[c])))


if __name__ == '__main__':
    main()
