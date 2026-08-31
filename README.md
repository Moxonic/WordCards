WordCard

A simple flashcard app for learning vocabulary and other things you need to memorize.

How it works

Each card shows a term on one side. Flip it to reveal the answer, then swipe (or click) to sort it:

Swipe left — you didn't know it. The card gets put back into the deck to show up again.
Swipe right — you knew it. The card moves on and won't repeat as often.

Cards you struggle with keep resurfacing until you've actually learned them, so practice time goes where it's needed instead of being spread evenly across everything.

Features
Create your own decks (vocabulary, definitions, facts, anything with a front/back pair)
Swipe-based review: left to repeat, right to advance
Cards you get wrong come back into rotation automatically
Track progress per deck
Getting started
bash
git clone <repo-url>
cd wordcard
npm install
npm run dev
Usage
Create a new deck and add cards (term + answer).
Start a review session.
For each card, try to recall the answer before flipping it.
Swipe left if you got it wrong, right if you got it right.
Repeat until the deck is clear for that session.
