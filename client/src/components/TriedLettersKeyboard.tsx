interface Props {
  attemptedLetters: Set<string>
  targetName: string
}

const ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
]

export function TriedLettersKeyboard({ attemptedLetters, targetName }: Props) {
  const nameLetters = new Set(targetName.toLowerCase().replace(/\s/g, '').split(''))

  return (
    <div className="flex flex-col items-center gap-1">
      {ROWS.map((row, ri) => (
        <div key={ri} className="flex gap-1">
          {row.map((letter) => {
            const attempted = attemptedLetters.has(letter)
            const inName = nameLetters.has(letter)

            let className =
              'w-8 h-9 flex items-center justify-center rounded text-xs font-semibold uppercase transition-colors '

            if (attempted && inName) {
              className += 'bg-sofi-purple text-white'
            } else if (attempted) {
              className += 'bg-gray-200 text-gray-400 line-through'
            } else {
              className += 'bg-gray-50 text-gray-300 border border-gray-100'
            }

            return (
              <div key={letter} className={className}>
                {letter}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
