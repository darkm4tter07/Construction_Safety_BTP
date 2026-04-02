// components/Profile/FitnessMetrics.js
import React from 'react';

const FitnessMetrics = ({ data }) => {
  if (!data) return null;

  return (
    <div>
      <div className='grid grid-cols-3 gap-3'>
        {/* Steps Card */}
        <div className='bg-blue-950/30 rounded-xl p-5 border border-blue-900/40'>
          <div className='flex items-center justify-between mb-3'>
            <span className='text-2xl'>👟</span>
            <span className='text-[10px] font-medium text-blue-400/80 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20'>
              STEPS
            </span>
          </div>
          <div className='text-3xl font-bold text-zinc-100 tabular-nums'>
            {data.steps?.toLocaleString() ?? 0}
          </div>
          <div className='text-[11px] text-zinc-400 mt-1'>Daily movement</div>
        </div>

        {/* Heart Rate Card */}
        <div className='bg-red-950/30 rounded-xl p-5 border border-red-900/40'>
          <div className='flex items-center justify-between mb-3'>
            <span className='text-2xl'>❤️</span>
            <span className='text-[10px] font-medium text-red-400/80 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20'>
              BPM
            </span>
          </div>
          <div className='text-3xl font-bold text-zinc-100 tabular-nums'>
            {data.heart_rate || '—'}
          </div>
          <div className='text-[11px] text-zinc-400 mt-1'>Avg heart rate</div>
        </div>

        {/* Calories Card */}
        <div className='bg-orange-950/30 rounded-xl p-5 border border-orange-900/40'>
          <div className='flex items-center justify-between mb-3'>
            <span className='text-2xl'>🔥</span>
            <span className='text-[10px] font-medium text-orange-400/80 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20'>
              KCAL
            </span>
          </div>
          <div className='text-3xl font-bold text-zinc-100 tabular-nums'>
            {data.calories ?? 0}
          </div>
          <div className='text-[11px] text-zinc-400 mt-1'>Calories burned</div>
        </div>
      </div>

      <div className='mt-4 text-[10px] text-zinc-500 text-center'>
        Last updated: {data.date}
      </div>
    </div>
  );
};

export default FitnessMetrics;