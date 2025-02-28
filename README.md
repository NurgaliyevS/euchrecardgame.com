# Euchre Card Game

A simple web-based implementation of the classic Euchre card game.

## How to Play

1. Open `index.html` in your web browser to start the game.
2. Click the "Deal" button to start a new hand.
3. The game will deal 5 cards to each player and turn up a card for potential trump.

### Bidding Phase

1. Starting with the player to the left of the dealer, each player has the option to "Pass" or "Order Up" the turned up card as trump.
2. If everyone passes, the turned up card is put aside, and a second round of bidding begins.
3. In the second round, each player can either pass or select a trump suit (different from the turned up card's suit).
4. If everyone passes in the second round, the cards are redealt.

### Playing Phase

1. The player to the left of the dealer leads the first trick.
2. Players must follow suit if possible.
3. If a player cannot follow suit, they can play any card.
4. The highest card of the led suit wins the trick, unless a trump card is played, in which case the highest trump wins.
5. The winner of a trick leads the next trick.

### Special Cards

- The Jack of the trump suit (Right Bower) is the highest card.
- The Jack of the same color as the trump suit (Left Bower) is the second highest card and is considered a trump card.

### Scoring

- The team that named trump must take at least 3 tricks to score points.
- Taking 3 or 4 tricks: 1 point
- Taking all 5 tricks (a "march"): 2 points
- If the team that named trump fails to get 3 tricks, the opposing team scores 2 points (a "euchre").
- First team to 10 points wins the game.

## Game Features

- Play against AI opponents
- Full implementation of Euchre rules
- Visual card display
- Score tracking

## Technical Details

This game is built using:
- HTML
- CSS
- Vanilla JavaScript

No external libraries or dependencies are required.

## License

This project is open source and available for personal and educational use. 