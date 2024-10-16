import pactum from 'pactum';
import { StatusCodes } from 'http-status-codes';
import { SimpleReporter } from '../simple-reporter';

describe('Deck of cards', () => {
  const p = pactum;
  const rep = SimpleReporter;
  const baseUrl = 'https://deckofcardsapi.com/api';
  let deckId = '';

  p.request.setDefaultTimeout(30000);

  beforeAll(() => p.reporter.add(rep));
  afterAll(() => p.reporter.end());

  describe('DECK', () => {
    it('New Deck', async () => {
      deckId = await p
        .spec()
        .post(`${baseUrl}/deck/new/`)
        .expectStatus(StatusCodes.OK)
        .expectJsonSchema({
          $schema: 'http://json-schema.org/draft-04/schema#',
          type: 'object',
          properties: {
            success: {
              type: 'boolean'
            },
            deck_id: {
              type: 'string'
            },
            remaining: {
              type: 'integer'
            },
            shuffled: {
              type: 'boolean'
            }
          },
          required: ['success', 'deck_id', 'remaining', 'shuffled']
        })
        .returns('deck_id');
    });
    
    it('Shuffle Deck', async () => {
      await p
        .spec()
        .post(`${baseUrl}/deck/${deckId}/shuffle/`)
        .expectStatus(StatusCodes.OK)
        .expectBodyContains('52')
        .expectJsonLike({ shuffled: true });
    });     
    
    it('Deck with selected cards', async () => {
      await p
        .spec()
        .post(`${baseUrl}/deck/new/shuffle/?cards=AS,2S,KS,AD,2D,KD,AC,2C,KC,AH,2H,KH`)        
        .expectStatus(StatusCodes.OK)
        .expectBodyContains('12')
        .expectJsonLike({ shuffled: true });
    });    
    
    // Falha ao criar pilha
    it('Adding to Piles', async () => {
      await p
        .spec()
        .post(`${baseUrl}/deck/${deckId}/pile/bombaNuclear/add/?cards=AS,2S`)        
        .expectStatus(StatusCodes.OK)
        .expectBodyContains('12')        
        .expectJsonLike({ "piles": {
          "discard": {
              "remaining": 0
          }
      }});
    });  
    
    // Esse aqui quebra pq a pilha não é criada no teste anterior
    // se jogar no navegador com o nome da pilha e o deckId, funciona
    it('Shuffle Piles', async () => {
      await p
        .spec()
        .post(`${baseUrl}/deck/${deckId}/pile/bombaNuclear/shuffle/`)        
        .expectStatus(StatusCodes.OK)
        .expectBodyContains('12')        
        .expectJsonLike({ "piles": {
          "discard": {
              "remaining": 2
          }
      }});
    }); 
    
    // quebra pq não tem pilha criada. 
    // se jogar no navegador com o nome da pilha e o deckId, funciona
    it('Listing Cards in Piles', async () => {
      await p
        .spec()
        .post(`${baseUrl}/deck/${deckId}/pile/bombaNuclear/list/`)        
        .expectStatus(StatusCodes.OK)
        .expectBodyContains('12')        
        .expectJsonLike({ "piles": {
          "bombaNuclear": {
            "remaining": 0, 
            "cards": []
          }}});
    }); 
    
    // Esse não especifica o motivo do erro
    it('Listing Cards in Piles', async () => {
      await p
        .spec()
        .post(`${baseUrl}/deck/${deckId}/pile/bombaNuclear/draw/random`)                
        .expectJsonLike({ "error": "Not enough cards remaining to draw 1 additional"});
    }); 
    
    it('Returning cards to the deck', async () => {
      await p
        .spec()
        .post(`${baseUrl}/deck/${deckId}/return`)
        .expectStatus(StatusCodes.OK)
        .expectBodyContains('52');
    }); 

    it('Back of Card Image', async () => {
      await p
        .spec()
        .get(`https://deckofcardsapi.com/static/img/back.png`)
        .expectStatus(StatusCodes.OK)        
    }); 

  });
});
