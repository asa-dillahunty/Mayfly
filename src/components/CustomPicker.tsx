import { useCallback, useEffect, useRef } from "react";
import styles from "./sass/CustomPicker.module.scss";

const hours = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
  22, 23, 24,
];
const minutes = [0, 0.5];

interface PickerProps {
  value: HoursAndMinutes;
  onChange: (val: HoursAndMinutes) => void;
}

interface HoursAndMinutes {
  hours: number;
  minutes: number;
}

export default function Picker({ value, onChange }: PickerProps) {
  const setHourFromInside = (hours: number) => {
    if (value.hours !== hours) {
      onChange({
        hours: hours,
        minutes: value.minutes,
      });
    }
  };

  const setMinFromInside = (min: number) => {
    if (value.minutes !== min) {
      onChange({
        hours: value.hours,
        minutes: min,
      });
    }
  };

  return (
    <div className={styles.pickerContainer}>
      <PickerWheel
        values={hours}
        value={value.hours}
        onChange={setHourFromInside}
      />
      <PickerWheel
        values={minutes}
        value={value.minutes}
        onChange={setMinFromInside}
      />
      <div className={styles.selectBar}></div>
    </div>
  );
}

interface PickerWheelProps {
  value: number;
  values: number[];
  onChange: (val: number) => void;
}

function PickerWheel({ value, values, onChange }: PickerWheelProps) {
  const scrollTimeoutID = useRef<number | undefined>(undefined);
  const currentlyTouching = useRef(false);
  const selectContainerRef = useRef<HTMLDivElement>(null);

  const getScrollPosition = useCallback(
    (value: number) => {
      const container = selectContainerRef.current;
      if (container === null) return 0; // this should be impossible

      const padding = parseFloat(
        getComputedStyle(container).getPropertyValue("padding-top"),
      );
      const itemHeight =
        container?.firstElementChild?.firstElementChild?.clientHeight ?? 0;
      const selectedIndex = values.indexOf(value);

      const scrollPosition =
        (selectedIndex + 0.5) * itemHeight -
        container.clientHeight / 2 +
        padding;

      return scrollPosition;
    },
    [values],
  );

  const centerOnValue = useCallback(
    (value: number) => {
      const container = selectContainerRef.current;
      if (container === null) return;

      container.scrollTop = getScrollPosition(value);
    },
    [getScrollPosition],
  );

  useEffect(() => {
    centerOnValue(value);
  }, [value, centerOnValue]);

  useEffect(() => {
    return () => clearTimeout(scrollTimeoutID.current);
  }, []);

  const handleScroll = () => {
    if (currentlyTouching.current) return;
    clearTimeout(scrollTimeoutID.current);
    scrollTimeoutID.current = window.setTimeout(() => {
      if (!currentlyTouching.current) snapToClosest();
    }, 150);
  };

  const snapToClosest = () => {
    const container = selectContainerRef.current;
    const selectedIndex = getSelectedIndex();
    const newValue = values[selectedIndex];
    const newPosition = getScrollPosition(newValue);
    if (container === null) return;

    // do the snap
    if (container.scrollTop !== newPosition) container.scrollTop = newPosition;
    if (newValue === value) return;
    handleChange(newValue);
  };

  const getSelectedIndex = () => {
    const container = selectContainerRef.current;
    if (container === null) return 0; // should never happen

    const scrollTop = container.scrollTop;
    const itemHeight =
      container?.firstElementChild?.firstElementChild?.clientHeight ?? 0;
    const padding = parseFloat(
      getComputedStyle(container).getPropertyValue("padding-top"),
    );
    const si =
      (scrollTop + container.clientHeight / 2 - padding) / itemHeight - 0.5;
    let selectedIndex = Math.round(si);

    if (selectedIndex > values.length - 1) {
      selectedIndex = values.length - 1;
    } else if (selectedIndex < 0) {
      selectedIndex = 0;
    }

    return selectedIndex;
  };

  const handleChange = (num: number) => {
    onChange(num);
  };

  const handleTouchEnd = () => {
    currentlyTouching.current = false;
    clearTimeout(scrollTimeoutID.current);
    scrollTimeoutID.current = window.setTimeout(() => {
      if (!currentlyTouching.current) snapToClosest();
    }, 50);
  };

  return (
    <div
      className={styles.selectContainer}
      onScroll={handleScroll}
      onTouchStart={() => (currentlyTouching.current = true)}
      onTouchEnd={handleTouchEnd}
      ref={selectContainerRef}
    >
      <div className={styles.selectList}>
        {values.map((val, index) => (
          <div
            key={index}
            className={styles.selectItem}
            onClick={() => handleChange(val)}
          >
            {val}
          </div>
        ))}
      </div>
    </div>
  );
}
