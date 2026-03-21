import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface Timezone {
  code: string;
  name: string;
  offset: string;
}

const timezones: Timezone[] = [
  { code: 'Pacific/Auckland', name: 'New Zealand Standard Time', offset: 'UTC+12' },
  { code: 'Pacific/Noumea', name: 'New Caledonia Time', offset: 'UTC+11' },
  { code: 'Australia/Sydney', name: 'Australian Eastern Standard Time', offset: 'UTC+10' },
  { code: 'Asia/Tokyo', name: 'Japan Standard Time', offset: 'UTC+9' },
  { code: 'Asia/Shanghai', name: 'China Standard Time', offset: 'UTC+8' },
  { code: 'Asia/Bangkok', name: 'Indochina Time', offset: 'UTC+7' },
  { code: 'Asia/Dhaka', name: 'Bangladesh Standard Time', offset: 'UTC+6' },
  { code: 'Asia/Kolkata', name: 'India Standard Time', offset: 'UTC+5:30' },
  { code: 'Asia/Dubai', name: 'Gulf Standard Time', offset: 'UTC+4' },
  { code: 'Europe/Moscow', name: 'Moscow Standard Time', offset: 'UTC+3' },
  { code: 'Europe/Athens', name: 'Eastern European Time', offset: 'UTC+2' },
  { code: 'Europe/Paris', name: 'Central European Time', offset: 'UTC+1' },
  { code: 'Europe/London', name: 'Greenwich Mean Time', offset: 'UTC+0' },
  { code: 'UTC', name: 'Coordinated Universal Time', offset: 'UTC+0' },
  { code: 'Atlantic/Azores', name: 'Azores Standard Time', offset: 'UTC-1' },
  { code: 'Atlantic/South_Georgia', name: 'South Georgia Time', offset: 'UTC-2' },
  { code: 'America/Argentina/Buenos_Aires', name: 'Argentina Time', offset: 'UTC-3' },
  { code: 'America/Caracas', name: 'Venezuela Time', offset: 'UTC-4' },
  { code: 'America/New_York', name: 'Eastern Standard Time', offset: 'UTC-5' },
  { code: 'America/Chicago', name: 'Central Standard Time', offset: 'UTC-6' },
  { code: 'America/Denver', name: 'Mountain Standard Time', offset: 'UTC-7' },
  { code: 'America/Los_Angeles', name: 'Pacific Standard Time', offset: 'UTC-8' },
  { code: 'America/Anchorage', name: 'Alaska Standard Time', offset: 'UTC-9' },
  { code: 'Pacific/Honolulu', name: 'Hawaii-Aleutian Standard Time', offset: 'UTC-10' },
  { code: 'Pacific/Midway', name: 'Samoa Standard Time', offset: 'UTC-11' },
];

interface TimeDisplayProps {
  selectedTimezone: string;
  onTimezoneChange: (timezone: string) => void;
  isDarkBackground: boolean;
}

export function TimeDisplay({ selectedTimezone, onTimezoneChange, isDarkBackground }: TimeDisplayProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedTz, setSelectedTz] = useState<Timezone>(
    timezones.find(tz => tz.code === selectedTimezone) || timezones.find(tz => tz.code === 'UTC') || timezones[0]
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const selectedItemRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Detect user's timezone on mount
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const matchedTimezone = timezones.find(tz => tz.code === userTimezone);
    
    if (matchedTimezone) {
      setSelectedTz(matchedTimezone);
      onTimezoneChange(matchedTimezone.code);
    } else {
      // Default to UTC if timezone not found in list
      const utcTimezone = timezones.find(tz => tz.code === 'UTC');
      if (utcTimezone) {
        setSelectedTz(utcTimezone);
        onTimezoneChange(utcTimezone.code);
      }
    }
  }, []);

  useEffect(() => {
    // Update local state when prop changes
    const matchedTimezone = timezones.find(tz => tz.code === selectedTimezone);
    if (matchedTimezone) {
      setSelectedTz(matchedTimezone);
    }
  }, [selectedTimezone]);

  useEffect(() => {
    // Scroll to selected item when dropdown opens
    if (isDropdownOpen && selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({
        block: 'center',
        behavior: 'auto',
      });
    }
  }, [isDropdownOpen]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date, timezone: string) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: timezone,
    }).format(date);
  };

  const handleTimezoneSelect = (timezone: Timezone) => {
    setSelectedTz(timezone);
    onTimezoneChange(timezone.code);
    setIsDropdownOpen(false);
  };

  return (
    <div>
      {/* Time Display */}
      <div className="text-white/90 mb-3 text-center md:text-right">
        <div className="text-3xl font-mono font-light tracking-widest tabular-nums">
          {formatTime(currentTime, selectedTz.code)}
        </div>
      </div>

      {/* Timezone Selector */}
      <div className="relative flex justify-center md:justify-end">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 text-white/60 hover:text-white/90 transition-colors group"
        >
          <span className="text-xs font-medium tracking-wide uppercase">{selectedTz.name}</span>
          <ChevronDown className={`size-3.5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Glass Dropdown Menu */}
        {isDropdownOpen && (
          <>
            {/* Backdrop to close dropdown */}
            <div
              className="fixed inset-0 z-30"
              onClick={() => setIsDropdownOpen(false)}
            />
            
            {/* Dropdown */}
            <div className={`absolute top-full right-0 mt-2 z-40 min-w-[240px] backdrop-blur-md border rounded-lg shadow-2xl overflow-hidden ${
              isDarkBackground
                ? 'bg-white/10 border-white/20'
                : 'bg-white/20 border-white/30'
            }`}>
              <div className="max-h-[400px] overflow-y-auto">
                {timezones.map((timezone) => (
                  <button
                    key={timezone.code}
                    onClick={() => handleTimezoneSelect(timezone)}
                    className={`w-full px-4 py-3 text-left hover:bg-white/20 transition-colors flex justify-between items-center ${
                      selectedTz.code === timezone.code ? 'bg-white/10' : ''
                    }`}
                    ref={selectedTz.code === timezone.code ? selectedItemRef : null}
                  >
                    <span className="text-white/90 font-medium">{timezone.name}</span>
                    <span className="text-white/60 text-sm">{timezone.offset}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}