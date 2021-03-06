const mongoose = require('mongoose');
const chai = require('chai');
const chaiHTTP = require('chai-http');
const { expect } = chai;
const sinon = require('sinon');

const Game = require('./models');
const server = require('./server.js');

chai.use(chaiHTTP);

describe('Games', () => {
  before(done => {
    mongoose.Promise = global.Promise;
    mongoose.connect('mongodb://localhost/test');
    const db = mongoose.connection;
    db.on('error', () => console.error.bind(console, 'connection error'));
    db.once('open', () => {
      console.log('we are connected');
      done();
    });
  });

  after(done => {
    mongoose.connection.db.dropDatabase(() => {
      mongoose.connection.close(done);
      console.log('we are disconnected');
    });
  });
  let gameId;
  // hint - these wont be constants because you'll need to override them.
  beforeEach(done => {
    const newGame = new Game({
      title: 'Super Mario',
      genre: 'Classic',
      releaseDate: 'Jan 1 1985',
    });
    newGame.save((err, savedGame) => {
      if (err) {
        console.log(err);
        done();
      }
      gameId = savedGame._id.toString();
      done();
    });
  });

  afterEach(done => {
    Game.remove({}, err => {
      if (err) console.log(err);
      return done();
    });
  });

  // test the POST here
  describe('[POST] /api/game/create', () => {
    it('should post a new game to the database', done => {
      chai
        .request(server)
        .post('/api/game/create')
        .send({
          title: 'Sonic the Hedgehog',
          genre: 'Classic',
          releaseDate: 'Jan 1 1992',
        })
        .end((err, response) => {
          if (err) {
            console.log(err);
            done();
          }
          expect(response.status).to.equal(200);
          expect(response.body).to.be.an('object');
          expect(response.body.title).to.equal('Sonic the Hedgehog');
          done();
        });
    });
    it('should return an error if the required fields are not supplied', done => {
      chai
        .request(server)
        .post('/api/game/create')
        .send({})
        .then(response => {
          expect(response.status).to.equal(422);
          expect(response.body.errors.title.message).to.equal(
            'Path `title` is required.'
          );
          expect(response.body.errors.genre.message).to.equal(
            'Path `genre` is required.'
          );
          done();
        })
        .catch(err => {
          console.log(err);
          done();
        });
    });
  });

  // test the GET here
  describe('[GET] /api/game/get', () => {
    it('should get all the games in the database', done => {
      chai
        .request(server)
        .get('/api/game/get')
        .end((err, response) => {
          if (err) {
            console.log(err);
            done();
          }
          expect(response.status).to.equal(200);
          expect(response.body).to.be.an('array');
          expect(response.body.length).to.equal(1);
          expect(response.body[0].title).to.equal('Super Mario');
          done();
        });
    });
  });

  // Test the DELETE here
  describe('[DELETE] /api/game/destroy/:id', () => {
    it('should remove a game from the database', done => {
      const game = new Game({
        title: 'Gran Turismo',
        genre: 'Auto Racing',
        releaseDate: 'Jan 1 1998',
      });
      game.save((err, savedGame) => {
        chai
          .request(server)
          .delete('/api/game/destroy/' + game._id)
          .end((err, response) => {
            if (err) {
              console.log(err);
              done();
            }
            expect(response.status).to.equal(200);
            expect(response.body).to.be.a('object');
            done();
          });
      });
    });
  });

  // --- Stretch Problem ---
  // test the PUT here
  describe('[PUT] /api/game/update', () => {
    it('should update a game in the database', done => {
      const game = new Game({
        title: 'The Legend of Zelda',
        genre: 'RPG',
        releaseDate: 'Jan 1 1990',
      });
      game.save((err, savedGame) => {
        chai
          .request(server)
          .put('/api/game/update')
          .send({
            id: game._id,
            title: 'The Legend of Zelda: Breath of the Wild',
            genre: 'RPG',
          })
          .end((err, response) => {
            if (err) {
              console.log(err);
              done();
            }
            const { _id, title, genre } = response.body;
            expect(response.status).to.equal(200);
            expect(response.body).to.be.an('object');
            expect(title).to.equal('The Legend of Zelda: Breath of the Wild');
            expect(genre).to.equal('RPG');
            expect(_id).to.equal(game._id.toString());
            done();
          });
      });
    });
    it('should return an error if the required fields, id and title, are not supplied', done => {
      chai
        .request(server)
        .put('/api/game/update')
        .send({})
        .then(response => {
          expect(response.status).to.equal(422);
          expect(response.body.errors.title.message).to.equal(
            'Path `title` is required.'
          );
          expect(response.body.errors.id.message).to.equal(
            'Path `id` is required.'
          );
          done();
        })
        .catch(err => {
          console.log(err);
          done();
        });
    });
  });
});
