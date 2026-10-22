// Verses shown after each game and used by Daily Catch.
//
// Text is the King James Version (public domain), fetched from bible-api.com
// and checked by eye. A trailing "…" means the verse continues. Tags say which
// kind of moment a verse suits (see VerseTag).

export type VerseTag = "big-catch" | "empty-net" | "storm" | "follow" | "feed" | "deep" | "rest" | "daily";

export type Verse = { ref: string; text: string; tags: VerseTag[] };

export const VERSES: Verse[] = [
  { ref: "Luke 5:6", text: "And when they had this done, they inclosed a great multitude of fishes: and their net brake.", tags: ["big-catch"] },
  { ref: "John 21:6", text: "And he said unto them, Cast the net on the right side of the ship, and ye shall find. They cast therefore, and now they were not able to draw it for the multitude of fishes.", tags: ["big-catch"] },
  { ref: "John 21:11", text: "Simon Peter went up, and drew the net to land full of great fishes, an hundred and fifty and three: and for all there were so many, yet was not the net broken.", tags: ["big-catch"] },
  { ref: "Psalm 126:3", text: "The LORD hath done great things for us; whereof we are glad.", tags: ["big-catch"] },
  { ref: "Ephesians 3:20", text: "Now unto him that is able to do exceeding abundantly above all that we ask or think, according to the power that worketh in us…", tags: ["big-catch"] },
  { ref: "Luke 5:5", text: "And Simon answering said unto him, Master, we have toiled all the night, and have taken nothing: nevertheless at thy word I will let down the net.", tags: ["empty-net"] },
  { ref: "Psalm 126:5", text: "They that sow in tears shall reap in joy.", tags: ["empty-net"] },
  { ref: "Galatians 6:9", text: "And let us not be weary in well doing: for in due season we shall reap, if we faint not.", tags: ["empty-net", "daily"] },
  { ref: "Isaiah 40:31", text: "But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.", tags: ["empty-net", "daily"] },
  { ref: "Lamentations 3:22", text: "It is of the LORD’S mercies that we are not consumed, because his compassions fail not.", tags: ["empty-net"] },
  { ref: "Mark 4:39", text: "And he arose, and rebuked the wind, and said unto the sea, Peace, be still. And the wind ceased, and there was a great calm.", tags: ["storm"] },
  { ref: "Psalm 107:29", text: "He maketh the storm a calm, so that the waves thereof are still.", tags: ["storm"] },
  { ref: "Isaiah 43:2", text: "When thou passest through the waters, I will be with thee; and through the rivers, they shall not overflow thee: when thou walkest through the fire, thou shalt not be burned; neither shall the flame kindle upon thee.", tags: ["storm"] },
  { ref: "Matthew 14:27", text: "But straightway Jesus spake unto them, saying, Be of good cheer; it is I; be not afraid.", tags: ["storm"] },
  { ref: "Psalm 46:1", text: "God is our refuge and strength, a very present help in trouble.", tags: ["storm"] },
  { ref: "Matthew 4:19", text: "And he saith unto them, Follow me, and I will make you fishers of men.", tags: ["follow"] },
  { ref: "Mark 1:17", text: "And Jesus said unto them, Come ye after me, and I will make you to become fishers of men.", tags: ["follow"] },
  { ref: "John 10:27", text: "My sheep hear my voice, and I know them, and they follow me…", tags: ["follow"] },
  { ref: "Proverbs 11:30", text: "The fruit of the righteous is a tree of life; and he that winneth souls is wise.", tags: ["follow"] },
  { ref: "Matthew 28:19", text: "Go ye therefore, and teach all nations, baptizing them in the name of the Father, and of the Son, and of the Holy Ghost…", tags: ["follow"] },
  { ref: "John 6:9", text: "There is a lad here, which hath five barley loaves, and two small fishes: but what are they among so many?", tags: ["feed"] },
  { ref: "John 6:11", text: "And Jesus took the loaves; and when he had given thanks, he distributed to the disciples, and the disciples to them that were set down; and likewise of the fishes as much as they would.", tags: ["feed"] },
  { ref: "John 6:12", text: "When they were filled, he said unto his disciples, Gather up the fragments that remain, that nothing be lost.", tags: ["feed"] },
  { ref: "Luke 9:17", text: "And they did eat, and were all filled: and there was taken up of fragments that remained to them twelve baskets.", tags: ["feed"] },
  { ref: "Luke 6:38", text: "Give, and it shall be given unto you; good measure, pressed down, and shaken together, and running over, shall men give into your bosom. For with the same measure that ye mete withal it shall be measured to you again.", tags: ["feed"] },
  { ref: "2 Corinthians 9:8", text: "And God is able to make all grace abound toward you; that ye, always having all sufficiency in all things, may abound to every good work…", tags: ["feed"] },
  { ref: "Luke 5:4", text: "Now when he had left speaking, he said unto Simon, Launch out into the deep, and let down your nets for a draught.", tags: ["deep"] },
  { ref: "Psalm 107:23", text: "They that go down to the sea in ships, that do business in great waters…", tags: ["deep"] },
  { ref: "Psalm 107:24", text: "These see the works of the LORD, and his wonders in the deep.", tags: ["deep"] },
  { ref: "Psalm 46:10", text: "Be still, and know that I am God: I will be exalted among the heathen, I will be exalted in the earth.", tags: ["rest", "daily"] },
  { ref: "Matthew 11:28", text: "Come unto me, all ye that labour and are heavy laden, and I will give you rest.", tags: ["rest"] },
  { ref: "Isaiah 26:3", text: "Thou wilt keep him in perfect peace, whose mind is stayed on thee: because he trusteth in thee.", tags: ["rest"] },
  { ref: "Psalm 23:2", text: "He maketh me to lie down in green pastures: he leadeth me beside the still waters.", tags: ["rest"] },
  { ref: "John 3:16", text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.", tags: ["daily"] },
  { ref: "Psalm 23:1", text: "The LORD is my shepherd; I shall not want.", tags: ["daily"] },
  { ref: "Proverbs 3:5", text: "Trust in the LORD with all thine heart; and lean not unto thine own understanding.", tags: ["daily"] },
  { ref: "Philippians 4:13", text: "I can do all things through Christ which strengtheneth me.", tags: ["daily"] },
  { ref: "Jeremiah 29:11", text: "For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.", tags: ["daily"] },
  { ref: "Romans 8:28", text: "And we know that all things work together for good to them that love God, to them who are the called according to his purpose.", tags: ["daily"] },
  { ref: "Isaiah 41:10", text: "Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness.", tags: ["daily"] },
  { ref: "Joshua 1:9", text: "Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.", tags: ["daily"] },
  { ref: "Psalm 119:105", text: "Thy word is a lamp unto my feet, and a light unto my path.", tags: ["daily"] },
  { ref: "Matthew 6:33", text: "But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.", tags: ["daily"] },
  { ref: "1 John 4:19", text: "We love him, because he first loved us.", tags: ["daily"] },
  { ref: "Romans 12:12", text: "Rejoicing in hope; patient in tribulation; continuing instant in prayer…", tags: ["daily"] },
  { ref: "Psalm 27:1", text: "The LORD is my light and my salvation; whom shall I fear? the LORD is the strength of my life; of whom shall I be afraid?", tags: ["daily"] },
  { ref: "Psalm 118:24", text: "This is the day which the LORD hath made; we will rejoice and be glad in it.", tags: ["daily"] },
  { ref: "Micah 6:8", text: "He hath shewed thee, O man, what is good; and what doth the LORD require of thee, but to do justly, and to love mercy, and to walk humbly with thy God?", tags: ["daily"] },
  { ref: "Matthew 5:16", text: "Let your light so shine before men, that they may see your good works, and glorify your Father which is in heaven.", tags: ["daily"] },
  { ref: "Colossians 3:23", text: "And whatsoever ye do, do it heartily, as to the Lord, and not unto men…", tags: ["daily"] },
  { ref: "Hebrews 11:1", text: "Now faith is the substance of things hoped for, the evidence of things not seen.", tags: ["daily"] },
  { ref: "2 Timothy 1:7", text: "For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.", tags: ["daily"] },
  { ref: "Psalm 37:4", text: "Delight thyself also in the LORD; and he shall give thee the desires of thine heart.", tags: ["daily"] },
  { ref: "John 14:6", text: "Jesus saith unto him, I am the way, the truth, and the life: no man cometh unto the Father, but by me.", tags: ["daily"] },
  { ref: "Romans 5:8", text: "But God commendeth his love toward us, in that, while we were yet sinners, Christ died for us.", tags: ["daily"] },
  { ref: "Ephesians 2:8", text: "For by grace are ye saved through faith; and that not of yourselves: it is the gift of God…", tags: ["daily"] },
  { ref: "1 Corinthians 13:13", text: "And now abideth faith, hope, charity, these three; but the greatest of these is charity.", tags: ["daily"] },
  { ref: "Proverbs 16:3", text: "Commit thy works unto the LORD, and thy thoughts shall be established.", tags: ["daily"] },
  { ref: "Psalm 34:8", text: "O taste and see that the LORD is good: blessed is the man that trusteth in him.", tags: ["daily"] },
  { ref: "John 8:12", text: "Then spake Jesus again unto them, saying, I am the light of the world: he that followeth me shall not walk in darkness, but shall have the light of life.", tags: ["daily"] },
  { ref: "Matthew 28:20", text: "Teaching them to observe all things whatsoever I have commanded you: and, lo, I am with you alway, even unto the end of the world. Amen.", tags: ["daily"] },
  { ref: "Psalm 100:4", text: "Enter into his gates with thanksgiving, and into his courts with praise: be thankful unto him, and bless his name.", tags: ["daily"] },
  { ref: "Proverbs 3:6", text: "In all thy ways acknowledge him, and he shall direct thy paths.", tags: ["daily"] },
  { ref: "Philippians 4:6", text: "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.", tags: ["daily"] },
  { ref: "Romans 15:13", text: "Now the God of hope fill you with all joy and peace in believing, that ye may abound in hope, through the power of the Holy Ghost.", tags: ["daily"] },
];

/** A verse for the moment, picked at random from those with this tag. */
export function verseFor(tag: VerseTag, seed = Math.random()): Verse {
  const list = VERSES.filter((v) => v.tags.includes(tag));
  return list[Math.floor(seed * list.length) % list.length];
}

/** Verses short enough to play as a Daily Catch (28 words or fewer). */
export const DAILY_POOL: Verse[] = VERSES.filter((v) => v.tags.includes("daily") && v.text.split(/\s+/).length <= 28);
