from bottle import run, request, response, Bottle
from truckpad.bottle.cors import CorsPlugin, enable_cors
from models import (Note, note_schema, notes_schema, create_tables_if_needed,
                    User, user_schema)
from peewee import DoesNotExist
from authentication import encode_auth_token, authenticate

import json


app = Bottle()


@enable_cors
@app.route('/notes')
def list_notes():
    user = authenticate(request)

    if user is None:
        response.status = 401
        return {'error': 'Authentication credentials not valid.'}

    notes = notes_schema.dumps(Note.select().where(Note.owner == user.id))
    return notes.data


@enable_cors
@app.route('/notes', method='POST')
def create_note():
    user = authenticate(request)

    if user is None:
        response.status = 401
        return {'error': 'Authentication credentials not valid.'}

    body = request.body.read()
    errors = note_schema.validate(json.loads(body))

    if errors:
        response.status = 400
        return {'errors': errors}

    note_dict = note_schema.loads(body).data

    note = Note.create(title=note_dict.get('title', ''),
                       content=note_dict.get('content', ''),
                       owner=user.id)
    return note_schema.dumps(note).data


@enable_cors
@app.route('/register', method='POST')
def register():
    body = request.body.read()
    errors = user_schema.validate(json.loads(body))

    if errors:
        response.status = 400
        return {'errors': errors}

    user_dict = user_schema.loads(body).data
    user = User.create(username=user_dict.get('username'),
                       password=user_dict.get('password'))
    return user_schema.dumps(user).data


@enable_cors
@app.route('/login', method='POST')
def login():
    body = request.body.read()
    body_dict = json.loads(body)
    errors = user_schema.validate(body_dict)

    if errors:
        response.status = 400
        return {'errors': errors}

    username = body_dict['username']
    password = body_dict['password']

    try:
        user = User.get(User.username == username)
    except DoesNotExist:
        response.status = 404
        return {'error': 'User "{}" does not exist.'.format(username)}

    if user.password != password:
        response.status = 401
        return {'error': 'Password is incorrect.'}

    auth_token = encode_auth_token(user.id)

    return {'user_id': user.id,
            'auth_token': auth_token}


create_tables_if_needed()

app.install(CorsPlugin(origins=['*']))
run(app, host='localhost', port=8000)
