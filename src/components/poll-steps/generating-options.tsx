"use client"

import React, { useEffect, useState } from "react";
import { Spin } from "antd";

export default function GeneratingOptions({ isLoading }: { isLoading: boolean }) {
    const [auto, setAuto] = React.useState(false);
    const [percent, setPercent] = React.useState(-50);
    const timerRef = React.useRef<ReturnType<typeof setTimeout>>(null);

    useEffect(() => {
        timerRef.current = setTimeout(() => {
            setPercent((v) => {
                const nextPercent = v + 5;
                return nextPercent > 150 ? -50 : nextPercent;
            });
        }, 100);
        return () => clearTimeout(timerRef.current!);
    }, [percent]);

    const mergedPercent = auto ? 'auto' : percent;

    return (
        <div className="flex justify-center items-center">
            <Spin tip="Generating Options" percent={mergedPercent} size="large" />
        </div>
    )
}