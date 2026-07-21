# -*- coding: utf-8 -*-

import names


def main():
    startApplication("MaxRunner")
    # 1. 입력창에 명시적으로 마우스 클릭을 주어 포커스 확보
    edit_box = waitForObject(names.o_Edit)
    mouseClick(edit_box)
    
    type(waitForObject(names.o_Edit), "Manager1!@")
    type(waitForObject(names.o_Edit), "<Return>")
    snooze(3) # 3초간 명시적 일시 정지
    mouseClick(waitForObject(names.o_TabItem_2))
    mouseClick(waitForObject(names.o_TabItem))
    mouseClick(waitForObject(names.o_TabItem_6))
    mouseClick(waitForObject(names.o_TabItem_4))
    mouseClick(waitForObject(names.o_TabItem_5))
    mouseClick(waitForObject(names.o_TabItem_3))
