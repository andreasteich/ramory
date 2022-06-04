# RAMory 🎸 
## How good is your 🧠 ? 
### Create a board and send it to friends to compete with their memory.
Our contribution to _Cloudflare Spring Dev Challenge 2022_, created with 🤙🏻 by @Andifiend97 and @dev-hias

**RAMory** is a competitive only game, built on _Cloudflare Pages_, _Durable Objects_ and _KV_. 

> The goal is to collect as much RAM as possible by matching similar silicons. But be aware of different ones, they make you loose your RAM a tiny bit on each match. The player with the highest amount of total memory wins.

### How to play
1. Go to https://ramory.rocks
2. Click on **Let's RAMble** or **Create a board**
3. Enter a username
4. Send the url to friends you wanna compete with
5. Happy RAMbling 🎉

## Architectural explanation
**RAMory 🎸** is built as a web application by using remix.run deployed to **Cloudflare Pages**. Most of the template and logic gets rendered server side and communication is done in remix manner, by leveraging forms and action handlers.

After creating a board, which is indeed a **durable object class* deployed within a **Cloudflare Worker** (located under `/ram`), you have to enter your username. To persist that username, we use a **session storage** that stores those sessions in a dedicated **KV namespace** called _sessionStorage_, surprise surprise 😄 

Every players that puts its card into the board (what we mean by that is, every player who joins the board by opening the url in the browser) gets a websocket assigned to make the real-time playing possible. Those web sockets are getting persisted locally in the durable object which is in charge of coordinating the state between each players. At the moment a very large not that great `switch case` handles all of those events and executes appropriate logics. We are looking forward into a refactoring related to this, where we want to isolate each case into it's own callback and attaching it separately as event listeners. (It might be the case that there's already a issue related to that by the time you're reading this readme)

After all, the grind was real and we had so much fun creating this game that we will make bigger and bigger, add new game modes, different chip sets and evolve it into a real online game beyond the Cloudflare Spring Developer Challenge. 

PS: We have never ever participated in a developer challenge, it's the first time for us, but at the end the imagination of one day there's a swag box arriving by our doors lit up a fire within us and we are so happy to get at this point. 


Thank you very much Cloudflare for making development of web applications this accessible and easy! 

Best regards
@Andifined97
@dev-hias 
