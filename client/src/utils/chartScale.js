const trimTrailingZero = (value) => value.replace(/\.0+$/, '');

const appendRange = (ticks, start, end, step) => {
    for (let tick = start; tick <= end; tick += step) {
        if (tick > ticks[ticks.length - 1]) {
            ticks.push(tick);
        }
    }
};

export const formatRevenueAxisLabel = (value) => {
    const numericValue = Number(value) || 0;
    const absoluteValue = Math.abs(numericValue);

    if (absoluteValue >= 1_000_000) {
        return `${trimTrailingZero((numericValue / 1_000_000).toFixed(1))}m`;
    }

    if (absoluteValue >= 1_000) {
        return `${trimTrailingZero((numericValue / 1_000).toFixed(1))}k`;
    }

    return numericValue.toLocaleString('en-PH');
};

export const getRevenueAxisTicks = (maxValue) => {
    const safeMaxValue = Number(maxValue) || 0;
    const ticks = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900];

    appendRange(ticks, 1_000, 10_000, 1_000);
    appendRange(ticks, 15_000, 100_000, 5_000);
    appendRange(ticks, 150_000, 1_000_000, 50_000);

    let nextMillionTick = 1_500_000;
    while (ticks[ticks.length - 1] < Math.max(safeMaxValue, 1_000_000)) {
        ticks.push(nextMillionTick);
        nextMillionTick += 500_000;
    }

    if (safeMaxValue <= 0) {
        return [0, 100];
    }

    const visibleTicks = ticks.filter((tick) => tick <= safeMaxValue);
    const nextTick = ticks.find((tick) => tick > safeMaxValue);

    if (nextTick !== undefined) {
        visibleTicks.push(nextTick);
    }

    return visibleTicks.length ? visibleTicks : [0, 100];
};

export const getRevenueAxisConfig = (data, valueKey = 'revenue') => {
    const maxValue = data.reduce((highestValue, item) => {
        const nextValue = Number(item?.[valueKey]) || 0;
        return Math.max(highestValue, nextValue);
    }, 0);

    const ticks = getRevenueAxisTicks(maxValue);
    const upperBound = ticks[ticks.length - 1] || 100;

    return {
        domain: [0, upperBound],
        ticks,
    };
};

export const getVisibleRevenueCategoryCount = (width) => {
    const safeWidth = Number(width) || 0;

    if (safeWidth <= 0) {
        return 5;
    }

    return Math.max(3, Math.floor((safeWidth - 40) / 110));
};
