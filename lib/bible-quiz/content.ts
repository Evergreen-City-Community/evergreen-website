// The pool of words and people. Each player gets their own shuffled order of
// these lists, so two people playing on the same day see different puzzles.
// Keep at least as many entries as there are days in the window.
//
// NOTE: this file ships to the browser, so answers can be read by anyone who
// looks. That is fine while scores stay on the player's own device. When the
// shared leaderboard is added, the answers move behind the server.

export type WordPuzzle = {
  /** Capital letters only. */
  answer: string;
  /** A clue shown from the start. Never contains the answer. */
  clue: string;
  /** Where to read about it; revealed after three tries. */
  ref: string;
};

export type PersonPuzzle = {
  /** The name shown when the round ends. */
  name: string;
  /** Other spellings and forms that count as right. */
  aliases?: string[];
  /** Four clues, hardest first. */
  clues: [string, string, string, string];
};

export const WORDS: WordPuzzle[] = [
  { answer: "WORD", clue: "“In the beginning was the ___, and the ___ was with God.”", ref: "John 1:1" },
  { answer: "GRACE", clue: "Undeserved kindness from God, the way we are saved.", ref: "Ephesians 2:8" },
  { answer: "LIGHT", clue: "“The people walking in darkness have seen a great ___.”", ref: "Isaiah 9:2" },
  { answer: "DAVID", clue: "Israel’s shepherd-king, whose family line the Messiah came from.", ref: "Matthew 1:1" },
  { answer: "VIRGIN", clue: "What Mary was when the angel Gabriel visited her.", ref: "Luke 1:27" },
  { answer: "ISAIAH", clue: "The prophet who wrote “For to us a child is born.”", ref: "Isaiah 9:6" },
  { answer: "CENSUS", clue: "Caesar Augustus ordered one, so Joseph and Mary travelled to Bethlehem.", ref: "Luke 2:1" },
  { answer: "NAZARETH", clue: "The town in Galilee where Mary and Joseph lived.", ref: "Luke 2:4" },
  { answer: "DREAM", clue: "How an angel spoke to Joseph, and how the wise men were warned.", ref: "Matthew 1:20" },
  { answer: "EGYPT", clue: "Where Joseph took his family to escape King Herod.", ref: "Matthew 2:13" },
  { answer: "HEROD", clue: "The troubled king who asked the wise men where the newborn king was.", ref: "Matthew 2:3" },
  { answer: "MAGI", clue: "Another word for the wise men who came from the East.", ref: "Matthew 2:1" },
  { answer: "GOLD", clue: "One of the three gifts the wise men gave, with frankincense and myrrh.", ref: "Matthew 2:11" },
  { answer: "MYRRH", clue: "A costly, fragrant resin, one of the three gifts for the child.", ref: "Matthew 2:11" },
  { answer: "TEMPLE", clue: "Where baby Jesus was presented to the Lord, eight days old.", ref: "Luke 2:22" },
  { answer: "SIMEON", clue: "The devout man who took baby Jesus in his arms and praised God.", ref: "Luke 2:25–28" },
  { answer: "ANNA", clue: "The very old prophetess who gave thanks when she saw the child.", ref: "Luke 2:36–38" },
  { answer: "MESSIAH", clue: "The Hebrew word for “Anointed One.”", ref: "John 1:41" },
  { answer: "WONDERFUL", clue: "Isaiah said His name will be ___ Counselor.", ref: "Isaiah 9:6" },
  { answer: "PEACE", clue: "Isaiah called Him the Prince of ___.", ref: "Isaiah 9:6" },
  { answer: "REJOICE", clue: "“___ in the Lord always. I will say it again: ___!”", ref: "Philippians 4:4" },
  { answer: "GLORY", clue: "What the angel army gave to God in the highest.", ref: "Luke 2:14" },
  { answer: "JOSEPH", clue: "Mary’s husband, a carpenter from David’s line.", ref: "Matthew 1:18–20" },
  { answer: "MARY", clue: "The young woman from Nazareth chosen to bear the Son of God.", ref: "Luke 1:30–31" },
  { answer: "GABRIEL", clue: "The angel who brought the news to Mary.", ref: "Luke 1:26–27" },
  { answer: "ANGEL", clue: "A heavenly messenger who appeared to the shepherds.", ref: "Luke 2:9" },
  { answer: "SHEPHERD", clue: "Night workers in the fields who heard the good news first.", ref: "Luke 2:8" },
  { answer: "STAR", clue: "What the wise men followed from the East.", ref: "Matthew 2:2" },
  { answer: "SWADDLING", clue: "Baby Jesus was wrapped in ___ clothes (older translations).", ref: "Luke 2:7" },
  { answer: "BETHLEHEM", clue: "Micah said the ruler of Israel would come from this small town.", ref: "Micah 5:2" },
  { answer: "EMMANUEL", clue: "A name that means “God with us.”", ref: "Matthew 1:23" },
  { answer: "MANGER", clue: "Where the baby was laid, because there was no room at the inn.", ref: "Luke 2:7" },
];

export const PEOPLE: PersonPuzzle[] = [
  { name: "Noah", clues: ["I was the father of Shem, Ham and Japheth.", "God told me to build a boat of cypress (gopher) wood.", "I gathered animals two by two.", "I survived the flood in the ark."] },
  { name: "Abraham", aliases: ["abram"], clues: ["I left my homeland when God called me.", "My name was first Abram.", "God promised me descendants as many as the stars.", "I was ready to offer my son Isaac, and I am the father of many nations."] },
  { name: "Moses", clues: ["As a baby I was hidden in a basket among the reeds.", "I was raised in Pharaoh’s household.", "I spoke with God at a burning bush.", "I led Israel out of Egypt and received the Ten Commandments."] },
  { name: "Ruth", clues: ["I came from the land of Moab.", "I said, “Where you go I will go.”", "I gathered grain in the field of Boaz.", "I was the great-grandmother of King David."] },
  { name: "Joshua", clues: ["I was Moses’ assistant.", "I was one of two spies who trusted God’s promise.", "I led Israel across the Jordan River.", "The walls of Jericho fell in my time."] },
  { name: "Gideon", clues: ["I was threshing wheat in a winepress, hiding from Midian.", "An angel greeted me as “mighty warrior.”", "I tested God with a fleece of wool.", "I defeated a huge army with 300 men and trumpets."] },
  { name: "Samson", clues: ["I was set apart to God from birth.", "My strength was tied to my uncut hair.", "I once tore a lion apart with my bare hands.", "Delilah betrayed me."] },
  { name: "David", clues: ["I was the youngest of Jesse’s sons.", "I was a shepherd before I was a king.", "I wrote many of the Psalms.", "I defeated Goliath with a sling and a stone."] },
  { name: "Solomon", clues: ["I was the son of King David.", "When God offered me anything, I asked for wisdom.", "I once settled a dispute between two women over a baby.", "I built the first temple in Jerusalem."] },
  { name: "Elijah", clues: ["I spoke for God during the reign of King Ahab.", "Ravens brought me food by a brook.", "I called down fire from heaven on Mount Carmel.", "I was taken up to heaven in a whirlwind."] },
  { name: "Esther", clues: ["I was a Jewish orphan raised by my cousin Mordecai.", "I became queen of Persia.", "I risked my life by going to the king uninvited.", "I saved my people from Haman’s plot."] },
  { name: "Daniel", clues: ["I was taken to Babylon as a young man.", "I refused the king’s rich food to stay faithful to God.", "I could interpret dreams.", "I spent a night in the lions’ den."] },
  { name: "Jonah", clues: ["God told me to go to Nineveh.", "I ran the other way, on a ship to Tarshish.", "A great storm struck and the sailors threw me overboard.", "I spent three days inside a great fish."] },
  { name: "Isaiah", clues: ["I was a prophet in Judah, about 700 years before Jesus.", "A burning coal touched my lips in a vision of God’s throne room.", "I wrote, “Comfort, comfort my people.”", "I foretold that a virgin would conceive and call her son Immanuel."] },
  { name: "Peter", aliases: ["simon peter", "simon"], clues: ["I was a fisherman, and my first name was Simon.", "My brother Andrew introduced me to Jesus.", "I stepped out of a boat and walked on water.", "I denied Jesus three times, then preached on the day of Pentecost."] },
  { name: "Paul", aliases: ["saul"], clues: ["I was born in Tarsus and trained as a Pharisee.", "I was first known as Saul.", "I met Jesus on the road to Damascus.", "I wrote many New Testament letters, such as Romans."] },
  { name: "Matthew", aliases: ["levi"], clues: ["I was a tax collector in Capernaum.", "Jesus said “Follow me” while I sat at my booth.", "I threw a big dinner for Jesus with other tax collectors.", "I wrote the first Gospel, and it tells of the wise men."] },
  { name: "Luke", clues: ["I was a doctor and a travelling companion of Paul.", "I wrote the book of Acts.", "I carefully investigated everything from the beginning.", "I wrote the Gospel that tells of the shepherds and the manger."] },
  { name: "Zacchaeus", aliases: ["zaccheus", "zacchaues"], clues: ["I was a chief tax collector in Jericho.", "I was short in height.", "I climbed a sycamore tree to see Jesus.", "Jesus came to my house, and I gave half my possessions to the poor."] },
  { name: "Martha", clues: ["I lived in Bethany and opened my home to Jesus.", "I was busy serving while my sister sat at His feet.", "I said, “Lord, if you had been here, my brother would not have died.”", "My brother was Lazarus."] },
  { name: "Lazarus", clues: ["I lived in Bethany.", "My sisters were Mary and Martha.", "I became ill and died.", "Jesus called me out of the tomb after four days."] },
  { name: "Mary Magdalene", aliases: ["magdalene", "mary of magdala"], clues: ["I came from the town of Magdala.", "Jesus set me free from seven demons.", "I stood near the cross.", "I was the first to see the risen Jesus at the tomb."] },
  { name: "Zechariah", aliases: ["zacharias", "zachariah", "zecharias"], clues: ["I was a priest serving in the temple in Jerusalem.", "My wife and I were old and had no children.", "I could not speak until my son was born, because I doubted a message.", "My son was John the Baptist."] },
  { name: "Elizabeth", clues: ["I was a descendant of Aaron, and old and childless.", "My relative Mary came to visit me.", "My baby leapt in my womb when she greeted me.", "I was the mother of John the Baptist."] },
  { name: "John the Baptist", aliases: ["john", "baptist", "john baptist"], clues: ["I wore camel hair and ate locusts and wild honey.", "I lived in the wilderness and called people to repent.", "I said, “Prepare the way for the Lord.”", "I baptized Jesus in the Jordan River."] },
  { name: "Gabriel", aliases: ["angel gabriel", "the angel gabriel"], clues: ["I appeared to the prophet Daniel long before Christmas.", "I stand in the very presence of God.", "I told Zechariah he would have a son.", "I told Mary she would give birth to Jesus."] },
  { name: "Joseph", aliases: ["joseph of nazareth", "joseph the carpenter"], clues: ["I was a carpenter from the line of David.", "I planned to quietly end my engagement until an angel spoke to me in a dream.", "I took my family to Egypt to escape a cruel king.", "I was Jesus’ earthly father."] },
  { name: "Mary", aliases: ["mary mother of jesus", "mother mary", "virgin mary", "mary the mother of jesus"], clues: ["I was a young woman from Nazareth, engaged to a carpenter.", "An angel told me I had found favour with God.", "I sang a song of praise that begins “My soul glorifies the Lord.”", "I gave birth to Jesus in Bethlehem."] },
  { name: "Simeon", clues: ["I lived in Jerusalem and was righteous and devout.", "The Holy Spirit promised I would not die before I saw the Messiah.", "The Spirit led me into the temple courts.", "I took baby Jesus in my arms and praised God."] },
  { name: "Anna", aliases: ["anna the prophetess", "anna the prophet"], clues: ["I was a widow, about eighty-four years old.", "I belonged to the tribe of Asher.", "I never left the temple, worshipping night and day.", "I was a prophetess who gave thanks when I saw baby Jesus."] },
  { name: "Herod", aliases: ["king herod", "herod the great"], clues: ["I was king of Judea and rebuilt the temple in Jerusalem.", "Wise men asked me where the newborn king was.", "I was troubled, and all Jerusalem with me.", "I ordered the baby boys of Bethlehem to be killed."] },
  { name: "Jesus", aliases: ["jesus christ", "jesus of nazareth", "christ", "the messiah"], clues: ["I called twelve ordinary people to follow me.", "I fed five thousand with a boy’s lunch.", "I rose from the dead on the third day.", "I was born in Bethlehem and laid in a manger."] },
];
