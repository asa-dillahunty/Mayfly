import { useCallback, useEffect, useRef, useState } from "react";
import "./CustomPicker.css";

const hours = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
  22, 23, 24,
];
const minutes = [0, 0.5];

export default function Picker({ value, onChange }) {
  const [selectedHour, setSelectedHour] = useState(value.hours);
  const [selectedMinutes, setSelectedMinutes] = useState(value.minutes);

  const setHourFromInside = (hours) => {
    if (value.hours !== hours) {
      onChange({
        hours: hours,
        minutes: value.minutes,
      });
    }
  };

  const setMinFromInside = (min) => {
    if (value.minutes !== min) {
      onChange({
        hours: value.hours,
        minutes: min,
      });
    }
  };

  useEffect(() => {
    setSelectedHour(value.hours);
    setSelectedMinutes(value.minutes);
  }, [value, setSelectedHour, setSelectedMinutes]);

  return (
    <div className="picker-container">
      <PickerWheel
        values={hours}
        value={selectedHour}
        onChange={setHourFromInside}
      />
      <PickerWheel
        values={minutes}
        value={selectedMinutes}
        onChange={setMinFromInside}
      />
      <div className="select-bar"></div>
    </div>
  );
}

function PickerWheel({ value, values, onChange }) {
  const [selectedValue, setSelectedValue] = useState(value);
  const [scrollTimeoutID, setScrollTimeoutID] = useState();
  const currentlyTouching = useRef(false);
  const selectContainerRef = useRef(null);

  const getScrollPosition = useCallback(
    (value) => {
      const container = selectContainerRef.current;
      const padding = parseFloat(
        getComputedStyle(container).getPropertyValue("padding-top")
      );
      const itemHeight = container.firstChild.firstChild.clientHeight;
      const selectedIndex = values.indexOf(value);
      const scrollPosition =
        (selectedIndex + 0.5) * itemHeight -
        container.clientHeight / 2 +
        padding;
      return scrollPosition;
    },
    [values]
  );

  const centerOnValue = useCallback(
    (value) => {
      const container = selectContainerRef.current;
      container.scrollTop = getScrollPosition(value);
    },
    [getScrollPosition]
  );

  useEffect(() => {
    centerOnValue(selectedValue);
  }, [selectedValue, centerOnValue]);

  useEffect(() => {
    setSelectedValue(value);
  }, [value, setSelectedValue]);

  const handleScroll = (_event) => {
    if (currentlyTouching.current) return;
    clearTimeout(scrollTimeoutID);
    const timeoutID = setTimeout(() => {
      if (!currentlyTouching.current) snapToClosest();
    }, 150);
    setScrollTimeoutID(timeoutID);
  };

  const snapToClosest = () => {
    const container = selectContainerRef.current;
    const selectedIndex = getSelectedIndex();
    const newValue = values[selectedIndex];
    const newPosition = getScrollPosition(newValue);

    // do the snap
    if (container.scrollTop !== newPosition) container.scrollTop = newPosition;
    if (newValue === selectedValue) return;
    setSelectedValue(newValue);
    handleChange(newValue);
  };

  const getSelectedIndex = () => {
    const container = selectContainerRef.current;
    const scrollTop = container.scrollTop;
    const itemHeight = container.firstChild.firstChild.clientHeight;
    const padding = parseFloat(
      getComputedStyle(container).getPropertyValue("padding-top")
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

  const handleChange = (num) => {
    setSelectedValue(num);
    onChange(num);
  };

  const handleTouchEnd = () => {
    currentlyTouching.current = false;
    clearTimeout(scrollTimeoutID);
    const timeoutID = setTimeout(() => {
      if (!currentlyTouching.current) snapToClosest();
    }, 50);
    setScrollTimeoutID(timeoutID);
  };

  return (
    <div
      className="select-container"
      onScroll={handleScroll}
      onTouchStart={() => (currentlyTouching.current = true)}
      onTouchEnd={handleTouchEnd}
      ref={selectContainerRef}
    >
      <div className="select-list">
        {values.map((val, index) => (
          <div
            key={index}
            className="select-item"
            onClick={() => handleChange(val)}
          >
            {val}
          </div>
        ))}
      </div>
    </div>
  );
}
