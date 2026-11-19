# Cutline

A food diary and diet tracker in a single HTML file, with a landing page and the tracker on one page. Type a food and an amount, check the calories and macros, then press Enter to log it.

## Features

- **Fast logging:** type `chicken breast` and `179`, `6oz`, `1lb`, or a count like `4x`, see the macros, and press Enter.
- **434 built-in foods:** chicken, beef cuts and ground-beef grades, pork, lamb, bison, venison, fish, eggs, dairy, vegetables, grains, fruit, brand items like Fage, Chobani, Oikos, Quest, Premier Protein and Fairlife, and about 290 items from 16 restaurant chains (McDonald's, Chick-fil-A, Whataburger, Chipotle, Starbucks and more), logged by count.
- **Custom foods:** add anything missing from its nutrition label.
- **Daily targets:** a calorie target from the Mifflin-St Jeor formula, your activity level and your deficit; protein and net-carb targets for keto or low carb; and an optional protein floor.
- **Weight tracking:** log your weight and see how many weeks are left to your goal weight.
- **History and insights:** your usual foods appear as one-tap buttons.

## Use it

- **On your computer:** download `index.html` and open it in a browser. No install, no build step.
- **As a website:** in the repo, go to **Settings → Pages** and set the source to the `main` branch, root folder. Your tracker will be at `https://<username>.github.io/<repo>/`.

## Where your data is saved

- **In a browser (or GitHub Pages):** everything stays in that browser's local storage, on that device only. Clearing site data deletes your log.
- **As a Claude artifact:** your log saves privately to your Claude account, and it falls back to the browser if account saving isn't available.

No data is sent anywhere else.

## Nutrition data

Generic foods use typical USDA values per 100g, weighed cooked unless the name says raw. Brand items use the label value for one serving. Recipes change, so check your package. These numbers are estimates, not medical advice.
