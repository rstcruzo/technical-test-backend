from models import User
from peewee import DoesNotExist

import jwt
import os


SECRET_KEY = os.getenv('SECRET_KEY', 'aDevelopmentSecretKey')


def encode_auth_token(user_id):
    """Encode an authorization token for the user with id `user_id`.

    :param user_id: id of the user
    :returns: authorization token and expiration date
    :rtype: pair

    """
    payload = {
        'sub': user_id
    }

    auth_token = jwt.encode(payload, SECRET_KEY, algorithm='HS256').decode()
    return auth_token


def decode_auth_token(auth_token):
    """Decode an authorization token.

    :param auth_token: authorization token
    :returns: the user id
    :rtype: integer

    """
    payload = jwt.decode(auth_token, SECRET_KEY)
    return payload['sub']


def authenticate(request):
    """Authenticate a user with the Authorization header on `request`.

    :param request: request made
    :returns: the authenticated user or None if authentication failed.
    :rtype: User

    """
    auth_header = request.headers.get('Authorization')
    if auth_header:
        auth_token = auth_header.split(" ")[1]
    else:
        return None

    try:
        user_id = decode_auth_token(auth_token)
        return User.get(User.id == user_id)
    except (DoesNotExist, jwt.ExpiredSignatureError, jwt.DecodeError):
        return None
