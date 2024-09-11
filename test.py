from unittest import TestCase
from app import app
from flask import session
import json

class FlaskTests(TestCase):

    def setUp(self):
        """Stuff to do before every test."""
        self.client = app.test_client()
        app.config['TESTING'] = True
        with self.client.session_transaction() as sess:
            # Initialize session variables
            sess['board'] = [["C", "A", "T", "T", "T"],
                             ["C", "A", "T", "T", "T"],
                             ["C", "A", "T", "T", "T"],
                             ["C", "A", "T", "T", "T"],
                             ["C", "A", "T", "T", "T"]]
            sess['highscore'] = 0
            sess['nplays'] = 0

    def test_homepage(self):
        """Make sure information is in the session and HTML is displayed."""
        with self.client:
            response = self.client.get('/')
            self.assertIn('board', session)
            self.assertEqual(session.get('highscore', 0), 0)
            self.assertEqual(session.get('nplays', 0), 0)
            self.assertIn(b'<p>High Score:', response.data)
            self.assertIn(b'Score:', response.data)
            self.assertIn(b'Seconds Left:', response.data)

    def test_valid_word(self):
        """Test if word is valid by modifying the board in the session."""
        with self.client.session_transaction() as sess:
            sess['board'] = [["C", "A", "T", "T", "T"],
                             ["C", "A", "T", "T", "T"],
                             ["C", "A", "T", "T", "T"],
                             ["C", "A", "T", "T", "T"],
                             ["C", "A", "T", "T", "T"]]
        response = self.client.get('/check-word?word=cat')
        self.assertEqual(response.json['result'], 'ok')

    def test_invalid_word(self):
        """Test if word is on the board."""
        with self.client:
            response = self.client.get('/check-word?word=impossible')
            self.assertEqual(response.json['result'], 'not-on-board')

    def test_non_english_word(self):
        """Test if word is not an English word."""
        with self.client:
            response = self.client.get('/check-word?word=fsjdakfkldsfjdslkfjdlksf')
            self.assertEqual(response.json['result'], 'not-word')

    def test_post_score(self):
        """Test posting a score and updating session variables."""
        with self.client:
            response = self.client.post('/post-score',
                                        data=json.dumps({'score': 10}),
                                        content_type='application/json')
            self.assertEqual(response.status_code, 200)
            self.assertIn(b'brokeRecord', response.data)

    def test_new_game(self):
        """Test starting a new game."""
        with self.client:
            response = self.client.get('/new-game')
            self.assertEqual(response.status_code, 200)
            data = response.json
            self.assertIn('board', data)
            self.assertIn('highscore', data)
            self.assertIn('nplays', data)

if __name__ == '__main__':
    import unittest
    unittest.main()
