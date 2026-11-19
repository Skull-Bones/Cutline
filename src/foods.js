// Food catalog: generic foods per 100g, brand items per serving, restaurant items per item.
  // Per 100g. Cooked weight unless the name says raw. F(name, aliases, kcal, protein, carbs, fiber, fat, [pieceName, pieceGrams])
  // S(...) takes label values for one serving and converts them to per 100g, so "1" or "1x" logs one serving.
  function F(n,a,cal,p,c,fi,f,pc){ return {n:n,a:a?a.split('|'):[],cal:cal,p:p,c:c,fi:fi,f:f,pc:pc?{name:pc[0],g:pc[1]}:null}; }
  function S(n,a,servName,servG,cal,p,c,fi,f){ var k=100/servG; return F(n,a,cal*k,p*k,c*k,fi*k,f*k,[servName,servG]); }
  var FOODS=[
    // Poultry
    F('Chicken breast, cooked','chicken breast|chicken|grilled chicken',165,31,0,0,3.6),
    F('Chicken breast, raw','',120,22.5,0,0,2.6),
    F('Chicken thigh, cooked','chicken thigh|thigh',209,26,0,0,10.9),
    F('Chicken thigh, raw','',121,19.7,0,0,4.3),
    F('Ground turkey, cooked','ground turkey|turkey',200,27,0,0,10),
    F('Turkey breast, sliced','turkey breast|deli turkey',135,30,0,0,0.7),
    F('Chicken wings, cooked','chicken wings|wings|wing',290,26.9,0,0,19.5,['wing',34]),
    F('Chicken drumstick, cooked','drumstick|drumsticks|chicken leg',216,27,0,0,11.2,['drumstick',52]),
    F('Rotisserie chicken, meat and skin','rotisserie chicken|whole chicken|roast chicken',239,27.3,0,0,13.6),
    F('Ground chicken, cooked','ground chicken',189,23.3,0,0,10.9),
    F('Chicken liver, cooked','chicken liver|chicken livers',167,24.5,0.9,0,6.5),
    F('Duck, roasted, meat only','duck|duck breast',201,23.5,0,0,11.2),
    F('Turkey bacon, cooked','turkey bacon',368,29.5,4.2,0,25.9,['slice',8]),
    // Beef: cooked values are USDA pan-browned crumbles or broiled/grilled steaks
    F('Ground beef 90/10, cooked','ground beef|hamburger|90/10',230,28.5,0,0,12),
    F('Ground beef 93/7, cooked','lean ground beef|93/7',209,28.9,0,0,9.5),
    F('Ground beef 95/5, cooked','extra lean ground beef|95/5',193,29.2,0,0,7.6),
    F('Ground beef 85/15, cooked','85/15',256,27.7,0,0,15.3),
    F('Ground beef 80/20, cooked','80/20',272,27,0,0,17.4),
    F('Ground beef 93/7, raw','',152,20.9,0,0,7),
    F('Ground beef 90/10, raw','',176,20,0,0,10),
    F('Ground beef 85/15, raw','',215,18.6,0,0,15),
    F('Ground beef 80/20, raw','',254,17.2,0,0,20),
    F('Ribeye steak, cooked','ribeye|rib eye|steak',249,27.3,0,0,14.7),
    F('Sirloin steak, cooked','sirloin|top sirloin',212,29.3,0,0,9.7),
    F('NY strip steak, cooked','strip steak|new york strip|ny strip|strip',223,28.6,0,0,11.2),
    F('Filet mignon, cooked','filet|filet mignon|tenderloin steak',211,30.5,0,0,8.9),
    F('Flank steak, cooked','flank',194,27.8,0,0,8.3),
    F('Top round steak, cooked','top round|london broil',170,30.1,0,0,4.6),
    F('Chuck roast, cooked','chuck roast|pot roast|chuck',216,30.5,0,0,10.5),
    F('Brisket, cooked','brisket',221,32.2,0,0,9.2),
    F('Beef jerky','jerky',410,33,11,1.8,26),
    S('Jack Link\'s beef jerky, original','jack links|jack link',"serving",28,80,10,6,0,1.5),
    F('Skirt steak, cooked','skirt|skirt steak|fajita steak',233,24.2,0,0,14.4),
    F('Beef short ribs, braised','short ribs|short rib',471,21.6,0,0,42),
    F('Corned beef, cooked','corned beef',251,18.2,0.5,0,19),
    F('Beef liver, cooked','beef liver|liver',175,26.5,5.2,0,4.7),
    F('Ground bison, cooked','bison|buffalo|ground bison',179,25.5,0,0,8.6),
    F('Ground venison, cooked','venison|deer|ground venison',187,26.5,0,0,8.2),
    F('Ground lamb, cooked','ground lamb',283,24.8,0,0,19.7),
    F('Lamb chop, cooked','lamb chop|lamb chops|lamb loin',297,26.1,0,0,20.6),
    F('Leg of lamb, roasted','lamb|leg of lamb',258,25.6,0,0,16.5),
    // Pork
    F('Bacon, cooked','bacon',541,37,1.4,0,42,['slice',8]),
    F('Pork chop, cooked','pork chop|pork',231,26,0,0,13),
    F('Pork tenderloin, cooked','tenderloin',143,26,0,0,3.5),
    F('Ham, sliced','ham',145,21,1.5,0,6),
    F('Pork shoulder / pulled pork, cooked','pulled pork|pork shoulder|pork butt|boston butt|carnitas',269,23.1,0,0,18.9),
    F('Pork spareribs, cooked','ribs|spare ribs|spareribs|pork ribs',397,29.1,0,0,30.3),
    F('Italian sausage, pork, cooked','italian sausage|sausage',324,18.4,1.9,0,26.4),
    F('Pepperoni','pepperoni',504,19.3,1.2,0,46.3,['slice',2]),
    // Fish & seafood
    F('Salmon, cooked','salmon',206,22,0,0,12),
    F('Salmon, raw','',208,20,0,0,13),
    F('Tuna, canned in water','tuna|canned tuna',116,26,0,0,0.8),
    F('Cod, cooked','cod',105,23,0,0,0.9),
    F('Tilapia, cooked','tilapia',128,26,0,0,2.7),
    F('Shrimp, cooked','shrimp',99,24,0.2,0,0.3),
    // Eggs
    F('Egg, whole','egg|eggs|boiled egg|hard boiled egg',143,12.6,0.7,0,9.5,['egg',50]),
    F('Egg whites','egg white|egg whites|liquid egg whites',52,10.9,0.7,0,0.2,['egg white',33]),
    // Yogurt & cottage cheese: brands use the label for one cup
    F('Greek yogurt, nonfat','greek yogurt|yogurt',59,10.2,3.6,0,0.4),
    F('Greek yogurt, whole','',97,9,4,0,5),
    S('Chobani Greek yogurt, plain nonfat','chobani|chobani plain','cup',150,80,14,6,0,0),
    S('Fage Total 0% Greek yogurt','fage|fage 0|fage total','cup',170,90,18,5,0,0),
    S('Oikos Pro yogurt, vanilla','oikos pro|oikos','cup',150,130,20,6,0,3),
    S('Oikos Triple Zero yogurt, vanilla','triple zero|oikos triple zero','cup',150,80,15,6,0,0),
    S('Siggi\'s skyr, plain 0%','siggis|siggi|skyr','cup',150,80,15,5,0,0),
    S('Two Good Greek yogurt, vanilla','two good|too good','cup',150,80,12,3,0,2),
    F('Cottage cheese, 2%','cottage cheese',81,10.4,4.8,0,2.3),
    S('Good Culture cottage cheese, 2%','good culture','cup',150,130,19,5,0,3),
    // Cheese, milk & dairy fats
    F('Cheddar cheese','cheddar|cheese',403,25,1.3,0,33),
    F('Mozzarella cheese','mozzarella',300,22,2.2,0,22),
    F('String cheese','string cheese|cheese stick',254,24.3,2.8,0,15.9,['stick',28]),
    F('Feta cheese','feta',264,14.2,4.1,0,21.3),
    F('Parmesan cheese','parmesan',431,38,4.1,0,29),
    F('Cream cheese','',342,6,4,0,34),
    F('Heavy cream','heavy cream|cream',340,2.8,2.8,0,36),
    F('Butter','butter',717,0.9,0.1,0,81),
    F('Whole milk','milk',61,3.2,4.8,0,3.3),
    S('Fairlife 2% milk','fairlife|fairlife milk','cup',240,120,13,6,0,4.5),
    // Protein shakes, powders & bars
    F('Whey protein powder','whey|protein powder',400,80,6,0,6,['scoop',30]),
    S('Optimum Nutrition Gold Standard whey','gold standard|optimum nutrition|on whey','scoop',32,120,24,3,0,1.5),
    S('Premier Protein shake','premier|premier protein|protein shake','bottle',325,160,30,4,0,3),
    S('Fairlife Core Power 26g shake','core power|fairlife shake','bottle',414,170,26,8,2,4.5),
    S('Quest protein bar','quest|quest bar','bar',60,190,21,22,12,9),
    S('RXBAR','rxbar|rx bar','bar',52,200,12,23,5,8),
    S('Barebells protein bar','barebells','bar',55,200,20,18,3,8),
    // Fats, nuts & seeds
    F('Olive oil','olive oil|oil',884,0,0,0,100),
    F('Coconut oil','',862,0,0,0,100),
    F('Avocado','avocado',160,2,8.5,6.7,14.7,['avocado',150]),
    F('Almonds','almonds',579,21,21.6,12.5,50),
    F('Cashews','cashews',553,18.2,30.2,3.3,43.9),
    F('Pistachios','pistachios',560,20.2,27.2,10.6,45.3),
    F('Walnuts','walnuts',654,15,13.7,6.7,65),
    F('Peanut butter','peanut butter',588,25,20,6,50),
    F('Chia seeds','chia',486,17,42,34,31),
    // Vegetables
    F('Broccoli, cooked','broccoli',35,2.4,7.2,3.3,0.4),
    F('Spinach, raw','spinach',23,2.9,3.6,2.2,0.4),
    F('Cauliflower, raw','cauliflower',25,1.9,5,2,0.3),
    F('Asparagus, cooked','asparagus',22,2.4,4.1,2,0.2),
    F('Green beans, cooked','green beans',35,1.9,7.9,4,0.3),
    F('Brussels sprouts, cooked','brussels sprouts|brussel sprouts',36,2.6,7.1,2.6,0.5),
    F('Zucchini, raw','zucchini',17,1.2,3.1,1,0.3),
    F('Bell pepper','bell pepper|pepper',31,1,6,2.1,0.3),
    F('Carrots, raw','carrots|carrot',41,0.9,9.6,2.8,0.2),
    F('Cabbage, raw','cabbage',25,1.3,5.8,2.5,0.1),
    F('Romaine lettuce','lettuce|romaine',17,1.2,3.3,2.1,0.3),
    F('Mushrooms, raw','mushrooms',22,3.1,3.3,1,0.3),
    F('Kale, raw','kale',49,4.3,8.8,3.6,0.9),
    F('Tomato','tomato',18,0.9,3.9,1.2,0.2),
    F('Cucumber','cucumber',15,0.7,3.6,0.5,0.1),
    F('Onion','onion',40,1.1,9.3,1.7,0.1),
    // Starches, grains & bread
    F('Sweet potato, baked','sweet potato',90,2,20,3,0.15),
    F('Potato, baked','potato',93,2.5,21,2.2,0.1),
    F('White rice, cooked','white rice|rice|jasmine rice',130,2.7,28,0.4,0.3),
    F('Brown rice, cooked','brown rice',112,2.3,23.5,1.8,0.8),
    F('Quinoa, cooked','quinoa',120,4.4,21.3,2.8,1.9),
    F('Pasta, cooked','pasta',158,5.8,31,1.8,0.9),
    F('Oats, dry','oats|oatmeal|rolled oats',389,16.9,66,10.6,6.9),
    S('Quaker Old Fashioned oats, dry','quaker','half cup',40,150,5,27,4,3),
    F('White bread','bread',265,9,49,2.7,3.2,['slice',28]),
    S('Dave\'s Killer Bread, 21 Whole Grains','daves killer bread|dave\'s killer bread|dkb','slice',45,110,5,22,5,1.5),
    F('Corn tortilla','corn tortilla',218,5.7,44.6,6.3,2.9,['tortilla',26]),
    S('Mission Carb Balance tortilla','carb balance|mission tortilla|low carb tortilla','tortilla',43,70,6,19,15,3),
    F('Rice cakes','rice cake|rice cakes',387,8.2,81.5,4.2,2.8,['cake',9]),
    F('Popcorn, air-popped','popcorn',387,12.9,77.8,14.5,4.5),
    // Beans, legumes & soy
    F('Black beans, cooked','black beans|beans',132,8.9,23.7,8.7,0.5),
    F('Lentils, cooked','lentils',116,9,20.1,7.9,0.4),
    F('Chickpeas, cooked','chickpeas|garbanzo',164,8.9,27.4,7.6,2.6),
    F('Edamame','edamame',121,11.9,8.9,5.2,5.2),
    F('Tofu, firm','tofu',144,17.3,2.8,2.3,8.7),
    F('Hummus','hummus',166,7.9,14.3,6,9.6),
    // Fruit
    F('Banana','banana',89,1.1,22.8,2.6,0.3,['banana',118]),
    F('Apple','apple',52,0.3,13.8,2.4,0.2,['apple',182]),
    F('Orange','orange',47,0.9,11.8,2.4,0.1,['orange',131]),
    F('Blueberries','blueberries',57,0.7,14.5,2.4,0.3),
    F('Strawberries','strawberries',32,0.7,7.7,2,0.3),
    F('Raspberries','raspberries',52,1.2,11.9,6.5,0.7),
    F('Grapes','grapes',69,0.7,18.1,0.9,0.2),
    F('Pineapple','pineapple',50,0.5,13.1,1.4,0.1),
    F('Mango','mango',60,0.8,15,1.6,0.4),
    F('Watermelon','watermelon',30,0.6,7.6,0.4,0.2),
    // Extras
    F('Dark chocolate, 70-85%','dark chocolate|chocolate',598,7.8,45.9,10.9,42.6),
    F('Honey','honey',304,0.3,82.4,0.2,0)
  ];
  // Restaurant items: each chain's published numbers for one item, logged by count ("1", "2x"), not grams.
  function X(n,a,u,cal,p,c,fi,f){ var o=F(n,a,cal,p,c,fi,f,[u||'item',100]); o.per=1; return o; }
  function CHAIN(ch,al,rows){ rows.forEach(function(r){ var nm=r[0].toLowerCase().indexOf(ch.toLowerCase())>-1?r[0]:ch+' '+r[0]; FOODS.push(X(nm,[al,r[1]].filter(Boolean).join('|'),r[7],r[2],r[3],r[4],r[5],r[6])); }); }
  CHAIN(`McDonald's`,`mcdonalds|mcd|mickey ds`,[[`Big Mac`,``,580,25,45,0,34,0],[`Quarter Pounder with Cheese`,`qpc`,520,30,42,0,26,0],[`Double Quarter Pounder with Cheese`,``,740,48,43,0,42,0],[`Bacon Quarter Pounder with Cheese`,``,630,36,43,0,35,0],[`McDouble`,``,390,22,32,0,20,0],[`Double Cheeseburger`,``,440,25,34,0,24,0],[`Cheeseburger`,``,300,15,31,0,13,0],[`Hamburger`,``,250,12,30,0,9,0],[`McChicken`,``,390,14,38,0,21,0],[`McCrispy`,``,470,26,46,0,20,0],[`Spicy McCrispy`,``,530,27,48,0,26,0],[`Filet-O-Fish`,`fish`,380,16,38,0,19,0],[`Chicken McNuggets, 6 piece`,`nuggets`,250,14,15,0,15,0],[`Chicken McNuggets, 10 piece`,`nuggets`,410,23,26,0,24,0],[`McCrispy Strips, 3 piece`,`strips`,400,31,24,0,20,0],[`Egg McMuffin`,``,310,17,30,0,13,0],[`Sausage McMuffin with Egg`,``,480,20,30,0,31,0],[`Sausage Burrito`,``,310,13,25,0,17,0],[`Hash Browns`,``,140,2,18,0,8,0],[`Fries, medium`,`french fries`,320,5,43,0,15,0],[`Fries, large`,`french fries`,480,7,65,0,23,0],[`Fruit & Maple Oatmeal`,`oatmeal`,320,6,64,4,4.5,0],[`Vanilla Cone`,`ice cream`,200,5,33,0,5,0],[`McFlurry with Oreo`,``,410,10,64,0,13,0]]);
  CHAIN(`Taco Bell`,`tacobell`,[[`Crunchy Taco`,``,170,8,13,3,10,0],[`Crunchy Taco Supreme`,``,190,8,15,3,11,0],[`Soft Taco`,``,180,9,18,3,8,0],[`Doritos Locos Taco`,``,170,8,12,3,10,0],[`Crunchwrap Supreme`,``,530,15,71,6,21,0],[`Chalupa Supreme`,``,360,12,31,4,20,0],[`Cheesy Gordita Crunch`,``,490,20,41,5,28,0],[`Bean Burrito`,``,360,13,54,8,10,0],[`Burrito Supreme`,``,400,16,51,7,14,0],[`Beefy 5-Layer Burrito`,`5 layer`,500,18,65,7,19,0],[`Cantina Chicken Bowl`,``,490,25,44,11,24,0],[`Cantina Chicken Burrito`,``,540,25,43,6,30,0],[`Quesadilla`,``,520,26,41,3,26,0],[`Mexican Pizza`,``,540,19,48,7,30,0],[`Nachos BellGrande`,`nachos`,740,17,80,13,39,0],[`Stacker`,``,400,17,42,4,18,0],[`Nacho Fries`,``,330,4,36,4,19,0],[`Cheesy Fiesta Potatoes`,``,240,3,28,3,13,0],[`Cinnamon Twists`,``,170,1,27,1,6,0]]);
  CHAIN(`Wendy's`,`wendys`,[[`Dave's Single`,`daves`,560,31,37,0,34,0],[`Dave's Double`,`daves`,810,50,37,0,52,0],[`Baconator`,``,890,59,36,0,58,0],[`Son of Baconator`,``,590,34,35,0,36,0],[`Jr. Cheeseburger`,`junior`,270,14,25,0,13,0],[`Double Stack`,``,380,23,25,0,21,0],[`Classic Chicken Sandwich`,``,550,28,55,0,25,0],[`Spicy Chicken Sandwich`,``,560,28,55,0,26,0],[`Grilled Chicken Ranch Wrap`,`wrap`,420,28,41,0,16,0],[`Chicken Nuggets, 10 piece`,`nuggets`,430,23,22,0,27,0],[`Spicy Chicken Nuggets, 10 piece`,`nuggets`,470,26,22,0,31,0],[`Chicken Tenders, 3 piece`,``,420,33,22,0,22,0],[`Parmesan Caesar Salad`,``,270,31,12,0,11,0],[`Cobb Salad`,``,410,37,16,0,23,0],[`Chili, small`,``,280,19,24,0,12,0],[`Fries, small`,`french fries`,260,4,35,0,12,0],[`Plain Baked Potato`,``,270,7,61,0,0,0],[`Chocolate Frosty, small`,`frosty`,310,9,49,0,9,0],[`Breakfast Baconator`,``,680,34,36,0,45,0]]);
  CHAIN(`In-N-Out`,`in n out|innout`,[[`Hamburger`,``,360,16,38,2,16,0],[`Cheeseburger`,``,430,20,40,2,21,0],[`Double-Double`,`double double`,610,34,42,2,34,0],[`Double-Double, mustard & ketchup`,`double double`,550,34,41,2,27,0],[`Double-Double, Protein Style`,`double double|lettuce wrap`,460,30,12,2,32,0],[`Cheeseburger, Protein Style`,`lettuce wrap`,280,16,11,2,19,0],[`Hamburger, Protein Style`,`lettuce wrap`,210,12,9,2,14,0],[`French Fries`,`fries`,360,6,49,6,15,0],[`Vanilla Shake`,``,590,16,66,0,31,0]]);
  CHAIN(`Chick-fil-A`,`chick fil a|chickfila|cfa`,[[`Chicken Sandwich`,``,420,29,41,1,16,0],[`Deluxe Sandwich`,``,490,32,43,1,21,0],[`Spicy Chicken Sandwich`,``,450,28,44,1,18,0],[`Grilled Chicken Sandwich`,``,390,28,45,3,11,0],[`Grilled Chicken Club`,``,520,37,45,3,22,0],[`Nuggets, 8 count`,``,250,27,11,0,11,0],[`Nuggets, 12 count`,``,380,40,16,0,17,0],[`Grilled Nuggets, 8 count`,``,130,25,1,0,3,0],[`Grilled Nuggets, 12 count`,``,200,38,2,0,4.5,0],[`Chick-n-Strips, 3 count`,`strips`,310,29,16,0,14,0],[`Cool Wrap`,``,660,43,32,14,45,0],[`Cobb Salad`,``,830,41,31,5,60,0],[`Market Salad`,``,550,28,42,5,31,0],[`Spicy Southwest Salad`,``,680,33,27,7,49,0],[`Waffle Fries, medium`,``,420,5,45,5,24,0],[`Mac & Cheese, medium`,`mac and cheese`,450,20,28,3,29,0],[`Chicken Biscuit`,``,460,19,45,2,23,0],[`Egg White Grill`,``,300,27,29,1,8,0],[`Hash Brown Scramble Bowl`,``,470,29,19,2,30,0],[`Chick-fil-A Sauce`,`sauce`,140,0,6,0,13,0],[`Kale Crunch Side`,``,170,4,13,4,12,0],[`Fruit Cup, medium`,``,70,1,16,2,0,0],[`Chicken Noodle Soup`,``,190,11,27,2,4.5,0]]);
  CHAIN(`Braum's`,`braums`,[[`Quarter lb. Cheeseburger`,`quarter pound`,530,29,40,0,28,0],[`Double Quarter lb. Cheeseburger`,`quarter pound`,730,47,40,2,41,0],[`Triple Quarter lb. Cheeseburger`,`quarter pound`,1040,71,43,0,64,0],[`Sixth lb. Junior Cheeseburger`,`jr`,390,20,37,0,18,0],[`Sixth lb. Deluxe Cheeseburger`,``,420,21,39,2,20,0],[`Quarter lb. Bacon Cheeseburger`,`quarter pound`,630,36,40,0,36,0],[`California Cheeseburger`,``,680,30,42,4,43,0],[`Grilled Chicken Sandwich`,``,430,32,38,0,18,0],[`Crispy Chicken Sandwich`,``,590,28,60,0,27,0],[`Chicken Strips, 4 piece`,``,490,28,29,0,29,0],[`French Fries, medium`,`fries`,310,4,43,0,14,0],[`Bowl of Chili`,``,420,27,45,0,15,0],[`Grilled Chicken Salad`,``,460,30,33,0,24,0],[`Breakfast Burrito`,``,450,20,39,0,23,0],[`Biscuit with Sausage, Egg & Cheese`,``,600,23,34,0,39,0],[`Premium Chocolate Shake, medium`,`shake`,1000,30,115,0,50,0]]);
  CHAIN(`Whataburger`,`wb|whata`,[[`Whataburger`,``,590,29,62,0,25,0],[`Double Meat Whataburger`,``,830,47,62,0,44,0],[`Triple Meat Whataburger`,``,1070,65,62,0,63,0],[`Jalapeño & Cheese Whataburger`,`jalapeno`,680,34,63,0,32,0],[`Bacon & Cheese Whataburger`,``,750,39,62,0,37,0],[`Whataburger Jr.`,`junior`,310,14,37,0,11,0],[`Patty Melt`,``,940,49,45,0,61,0],[`Honey BBQ Chicken Strip Sandwich`,``,890,38,87,0,42,0],[`Grilled Chicken Sandwich`,``,430,32,44,0,14,0],[`Whatachick'n Sandwich`,`whatachicken`,540,32,54,0,22,0],[`Whatachick'n Strips, 3 piece`,`whatachicken|strips`,460,24,30,0,27,0],[`Fries, medium`,`french fries`,400,4,51,0,21,0],[`Onion Rings, medium`,``,300,4,33,0,17,0],[`Breakfast on a Bun, sausage`,``,510,27,35,0,28,0],[`Honey Butter Chicken Biscuit`,``,580,13,52,0,36,0],[`Garden Salad with Grilled Chicken`,``,290,34,12,0,12,0],[`Cobb Salad with Grilled Chicken`,``,430,44,10,0,23,0],[`Hot Apple Pie`,``,270,3,34,0,14,0]]);
  CHAIN(`Taco Casa`,`tacocasa`,[[`Taco`,``,210,14,10,1,13,0],[`Soft Taco`,``,260,17,15,1,14,0],[`Tostada`,``,250,12,22,5,14,0],[`Super Taco`,``,380,24,16,2,23,0],[`Taco Lite`,``,470,26,23,2,30,0],[`Bean Burrito`,``,440,17,55,0,17,0],[`Combination Burrito`,``,480,25,47,0,21,0],[`Meat Burrito`,``,520,32,40,0,25,0],[`Super Burrito`,``,550,26,50,0,26,0],[`Chilada`,``,480,27,30,0,28,0],[`Nachos`,``,1070,21,110,0,60,0],[`Super Nachos`,``,1380,37,124,0,79,0],[`Chili Burger`,``,250,15,30,0,8,0],[`Frijoles`,``,390,19,38,13,19,0]]);
  CHAIN(`Pizza Hut`,`pizzahut`,[[`Pepperoni Pizza, large hand tossed slice`,``,320,13,36,0,14,`slice`],[`Personal Pan Pepperoni Pizza`,``,640,24,76,0,28,`pizza`],[`Traditional Wing, naked`,`wings`,80,9,0,0,4.5,`wing`],[`Traditional Wing, buffalo medium`,`wings`,100,9,5,0,4.5,`wing`],[`Bone-Out Wing, naked`,`boneless wings`,80,5,6,0,4,`wing`],[`Breadstick`,``,150,4,19,0,7,`breadstick`],[`Fried Mozzarella Stick`,`cheese stick`,80,3,6,0,5,`stick`],[`Pepperoni Lover's Melt`,`melt`,1130,53,88,0,63,0],[`Pepperoni Lover's Half Melt`,`melt`,580,27,47,0,31,0]]);
  CHAIN(`Starbucks`,`sbux`,[[`Caffè Latte, grande`,`latte|caffe latte`,190,13,19,0,7,`drink`],[`Caramel Macchiato, grande`,``,250,10,35,0,7,`drink`],[`Iced Caramel Macchiato, grande`,``,250,10,37,0,7,`drink`],[`Cappuccino, grande`,``,140,9,14,0,5,`drink`],[`Caffè Mocha, grande`,`mocha|caffe mocha`,370,14,43,0,15,`drink`],[`White Chocolate Mocha, grande`,``,390,13,47,0,17,`drink`],[`Caramel Frappuccino, grande`,`frap`,380,4,55,0,16,`drink`],[`Mocha Frappuccino, grande`,`frap`,370,5,54,0,15,`drink`],[`Iced Brown Sugar Oatmilk Shaken Espresso, grande`,`shaken espresso|oat milk`,150,2,27,0,4.5,`drink`],[`Pink Drink, grande`,``,140,0,28,0,2.5,`drink`],[`Strawberry Açaí Refresher, grande`,`acai|refresher`,90,0,23,0,0,`drink`],[`Vanilla Sweet Cream Cold Brew, grande`,``,110,1,14,0,5,`drink`],[`Chai Latte, grande`,`chai tea`,200,7,33,0,4.5,`drink`],[`Matcha Latte, grande`,``,220,11,31,0,6,`drink`],[`Cold Brew, grande`,``,5,0,0,0,0,`drink`],[`Egg White & Roasted Red Pepper Egg Bites`,`egg bites`,170,12,11,0,8,`order`],[`Bacon & Gruyère Egg Bites`,`egg bites|gruyere`,300,19,9,0,20,`order`],[`Turkey Bacon, Cheddar & Egg White Sandwich`,``,260,17,30,0,9,0],[`Bacon, Gouda & Egg Sandwich`,``,360,18,35,0,18,0],[`Double-Smoked Bacon, Cheddar & Egg Sandwich`,``,500,21,43,0,27,0],[`Impossible Breakfast Sandwich`,``,420,21,36,0,22,0],[`Spinach, Feta & Egg White Wrap`,``,290,20,34,0,8,0],[`Butter Croissant`,``,250,5,26,0,14,0],[`Chocolate Croissant`,``,300,5,34,0,18,0],[`Blueberry Streusel Muffin`,``,370,5,47,0,18,0],[`Birthday Cake Pop`,``,160,2,21,0,8,0]]);
  CHAIN(`KFC`,`kentucky fried chicken`,[[`Original Recipe Breast`,``,390,39,11,0,21,`piece`],[`Original Recipe Thigh`,``,280,19,8,0,19,`piece`],[`Original Recipe Drumstick`,``,130,12,4,0,8,`piece`],[`Original Recipe Wing`,``,130,10,3,0,8,`piece`],[`Extra Crispy Breast`,``,530,35,18,0,35,`piece`],[`Extra Crispy Thigh`,``,330,22,9,0,23,`piece`],[`Extra Crispy Drumstick`,``,170,10,5,0,12,`piece`],[`Kentucky Grilled Breast`,``,210,38,0,0,7,`piece`],[`Kentucky Grilled Thigh`,``,150,17,0,0,9,`piece`],[`Kentucky Grilled Drumstick`,``,80,11,0,0,4,`piece`],[`Original Recipe Tender`,``,170,11,20,0,6,`tender`],[`Famous Bowl`,``,590,31,67,0,22,0],[`Chicken Pot Pie`,``,720,26,60,0,41,0],[`Classic Chicken Sandwich`,``,650,34,49,0,35,0],[`Popcorn Chicken`,``,620,23,40,0,41,`order`],[`Mashed Potatoes & Gravy`,``,130,3,20,0,4.5,`side`],[`Mac & Cheese`,`mac and cheese`,140,5,17,0,6,`side`],[`Coleslaw`,``,170,1,14,0,12,`side`],[`Corn on the Cob`,``,70,2,17,0,0.5,0],[`Green Beans`,``,25,1,5,0,0,`side`],[`Secret Recipe Fries`,`fries`,320,5,41,0,15,`side`],[`Biscuit`,``,180,4,22,0,8,0]]);
  CHAIN(`Panda Express`,`panda`,[[`Orange Chicken`,``,560,19,63,0,25,`entree`],[`Grilled Teriyaki Chicken`,``,280,38,13,0,9,`entree`],[`Broccoli Beef`,``,190,17,14,0,7,`entree`],[`Kung Pao Chicken`,``,270,20,16,0,14,`entree`],[`Beijing Beef`,``,480,14,46,0,27,`entree`],[`Black Pepper Sirloin Steak`,``,200,17,15,0,8,`entree`],[`Honey Walnut Shrimp`,``,340,13,28,0,20,`entree`],[`String Bean Chicken Breast`,``,210,15,15,0,10,`entree`],[`Mushroom Chicken`,``,180,13,12,0,9,`entree`],[`Honey Sesame Chicken Breast`,``,420,16,44,0,20,`entree`],[`Black Pepper Chicken`,``,200,15,9,0,12,`entree`],[`Super Greens, side`,``,180,8,17,0,9,`side`],[`Chow Mein, side`,``,520,14,89,0,12,`side`],[`Fried Rice, side`,``,610,15,109,0,13,`side`],[`White Steamed Rice, side`,``,570,11,129,0,0,`side`],[`Chicken Egg Roll`,``,200,6,20,0,10,`roll`],[`Cream Cheese Rangoon, 3 piece`,``,190,5,24,0,8,`order`]]);
  CHAIN(`Burger King`,`bk`,[[`Whopper`,``,710,34,57,0,42,0],[`Whopper with Cheese`,``,790,37,58,0,49,0],[`Double Whopper`,``,980,56,57,0,62,0],[`Triple Whopper`,``,1250,78,57,0,82,0],[`Whopper Jr.`,`junior`,340,15,30,0,19,0],[`Bacon King`,``,1260,69,58,0,84,0],[`Hamburger`,``,260,14,29,0,10,0],[`Cheeseburger`,``,300,16,30,0,14,0],[`Bacon Double Cheeseburger`,``,500,30,31,0,29,0],[`Original Chicken Sandwich`,``,680,23,63,0,39,0],[`Royal Crispy Chicken`,``,600,31,54,0,31,0],[`Impossible Whopper`,``,670,32,64,0,35,0],[`Fries, medium`,`french fries`,370,5,50,0,17,0],[`Onion Rings, medium`,``,290,4,39,0,13,0],[`Sausage, Egg & Cheese Croissan'wich`,`croissanwich`,500,19,28,0,34,0],[`Hash Browns, small`,``,270,2,29,0,16,0]]);
  CHAIN(`Sonic`,`sonic drive in`,[[`Sonic Cheeseburger`,``,700,30,52,0,41,0],[`SuperSonic Double Cheeseburger`,`super sonic`,1040,50,54,0,68,0],[`Double Smasher`,`smash burger`,600,35,30,0,37,0],[`Jr. Double Cheeseburger`,`junior`,390,21,25,0,23,0],[`Crispy Tenders, 3 piece`,``,260,21,16,0,12,0],[`Crispy Chicken Sandwich`,``,520,24,52,0,24,0],[`Corn Dog`,``,230,6,23,0,13,0],[`All-American Hot Dog`,``,410,13,42,0,21,0],[`Chili Cheese Coney`,``,470,18,34,0,29,0],[`Breakfast Burrito, bacon`,``,470,25,35,0,25,0],[`Breakfast Burrito, sausage`,``,490,23,35,0,28,0],[`Tots, medium`,`tater tots`,360,3,43,0,19,0],[`Fries, medium`,`french fries`,370,3,39,0,22,0],[`Onion Rings, medium`,``,580,8,74,0,29,0],[`Mozzarella Sticks, 4 piece`,``,370,15,36,0,19,`order`]]);
  CHAIN(`Chili's`,`chilis`,[[`Oldtimer with Cheese`,``,850,49,45,0,53,0],[`Big Smasher Burger`,``,950,47,49,0,64,0],[`Bacon Cheeseburger`,``,1130,63,44,0,79,0],[`Classic Sirloin, 6 oz`,`steak`,250,34,1,0,12,0],[`Classic Sirloin, 10 oz`,`steak`,390,54,2,0,18,0],[`Classic Ribeye`,`steak`,620,67,0,0,39,0],[`Margarita Grilled Chicken`,``,640,69,61,0,14,0],[`Guiltless Grill Chicken Platter`,``,350,35,37,0,8,0],[`Crispy Crispers, 4 count`,`chicken crispers|tenders`,790,45,38,0,51,0],[`Chicken Fajitas`,``,480,62,22,0,17,0],[`Steak Fajitas`,``,570,57,24,0,29,0],[`Baby Back Ribs, half rack`,`ribs`,1130,68,54,0,73,0],[`Ancho Salmon`,``,590,48,41,0,31,0],[`Cajun Pasta with Grilled Chicken`,``,1160,64,109,0,51,0],[`Southwestern Eggrolls`,`egg rolls`,1020,36,108,0,49,0],[`Boneless Wings, 8 buffalo`,``,920,36,44,0,67,0],[`Chips & Salsa`,``,910,13,113,0,45,0],[`Santa Fe Chicken Salad, grilled`,``,540,35,24,0,35,0],[`Homestyle Fries`,``,420,6,60,0,17,`side`],[`Steamed Broccoli`,``,40,3,8,0,0,`side`],[`Mashed Potatoes`,``,230,4,25,0,13,`side`],[`Black Beans`,``,110,6,20,0,0.5,`side`],[`Mexican Rice`,``,160,3,27,0,4.5,`side`],[`Molten Chocolate Cake`,``,1140,13,147,0,57,0]]);
  CHAIN(`Chipotle`,``,[[`Chicken, 4 oz`,``,180,32,0,0,7,`portion`],[`Steak, 4 oz`,``,150,21,1,0,6,`portion`],[`Barbacoa, 4 oz`,``,170,24,2,0,7,`portion`],[`Carnitas, 4 oz`,``,210,23,0,0,12,`portion`],[`Sofritas, 4 oz`,``,150,8,9,0,10,`portion`],[`White Rice, 4 oz`,`cilantro lime rice`,210,4,40,0,4,`portion`],[`Brown Rice, 4 oz`,``,210,4,36,0,6,`portion`],[`Black Beans, 4 oz`,``,130,8,22,0,1.5,`portion`],[`Pinto Beans, 4 oz`,``,130,8,21,0,1.5,`portion`],[`Fajita Veggies, 2 oz`,``,20,1,5,0,0,`portion`],[`Fresh Tomato Salsa, 4 oz`,`pico`,25,0,4,0,0,`portion`],[`Roasted Chili-Corn Salsa, 4 oz`,`corn salsa`,80,3,16,0,1.5,`portion`],[`Tomatillo Green Salsa, 2 oz`,``,15,0,4,0,0,`portion`],[`Tomatillo Red Salsa, 2 oz`,``,30,0,4,0,0,`portion`],[`Sour Cream, 2 oz`,``,110,2,2,0,9,`portion`],[`Cheese, 1 oz`,``,110,6,1,0,8,`portion`],[`Guacamole, 4 oz`,`guac`,230,2,8,0,22,`portion`],[`Queso Blanco, 2 oz`,`queso`,120,5,4,0,9,`portion`],[`Romaine Lettuce, 1 oz`,``,5,0,1,0,0,`portion`],[`Flour Tortilla, burrito`,``,320,8,50,0,9,`tortilla`],[`Crispy Corn Tortillas, 3`,`taco shells`,200,3,29,0,9,`order`],[`Chips`,`tortilla chips`,540,7,73,0,25,`bag`]]);

