"use client";

interface LaunchButtonProps {
  count: number;
  onLaunch: () => void;
}

export const LaunchButton = ({ count, onLaunch }: LaunchButtonProps) => {
  return (
    <div className="absolute bottom-4 right-4 z-10">
      <button
        onClick={onLaunch}
        className="w-16 h-16 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors shadow-lg flex items-center justify-center"
        title={`${count}개 불꽃놀이 발사`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 ml-1"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      </button>
    </div>
  );
};
