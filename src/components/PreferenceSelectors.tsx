interface PreferenceSelectorsProps {
  mood: string | undefined;
  onMoodChange: (mood: string | undefined) => void;
  timeOfDay: string | undefined;
  onTimeOfDayChange: (timeOfDay: string | undefined) => void;
  activity: string | undefined;
  onActivityChange: (activity: string | undefined) => void;
  availableMoods: Array<{ value: string; label: string }>;
  availableTimeOfDay: Array<{ value: string; label: string }>;
  availableActivities: Array<{ value: string; label: string }>;
}

export default function PreferenceSelectors({
  mood,
  onMoodChange,
  timeOfDay,
  onTimeOfDayChange,
  activity,
  onActivityChange,
  availableMoods,
  availableTimeOfDay,
  availableActivities,
}: PreferenceSelectorsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 flex-shrink-0">
      <div>
        <label className="block text-sm font-semibold text-white/90 mb-3">Mood</label>
        <select
          className="w-full p-3 border border-white/20 rounded-xl bg-white/5 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition-all duration-300"
          value={mood || ''}
          onChange={(e) => onMoodChange(e.target.value || undefined)}
        >
          <option value="" className="bg-gray-800 text-white">Select mood</option>
          {availableMoods.map((moodOption) => (
            <option key={moodOption.value} value={moodOption.value} className="bg-gray-800 text-white">
              {moodOption.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-semibold text-white/90 mb-3">Time of Day</label>
        <select
          className="w-full p-3 border border-white/20 rounded-xl bg-white/5 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-400 transition-all duration-300"
          value={timeOfDay || ''}
          onChange={(e) => onTimeOfDayChange(e.target.value || undefined)}
        >
          <option value="" className="bg-gray-800 text-white">Select time</option>
          {availableTimeOfDay.map((time) => (
            <option key={time.value} value={time.value} className="bg-gray-800 text-white">
              {time.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-semibold text-white/90 mb-3">Activity</label>
        <select
          className="w-full p-3 border border-white/20 rounded-xl bg-white/5 text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-400 transition-all duration-300"
          value={activity || ''}
          onChange={(e) => onActivityChange(e.target.value || undefined)}
        >
          <option value="" className="bg-gray-800 text-white">Select activity</option>
          {availableActivities.map((activityOption) => (
            <option key={activityOption.value} value={activityOption.value} className="bg-gray-800 text-white">
              {activityOption.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
