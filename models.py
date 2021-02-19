from peewee import Model, CharField, SqliteDatabase, ForeignKeyField
from marshmallow import Schema, fields, validate


db = SqliteDatabase('notes.db')


class User(Model):
    username = CharField()
    password = CharField()

    class Meta:
        database = db


class UserSchema(Schema):
    id = fields.Int()
    username = fields.Str(required=True)
    password = fields.Str(required=True)


user_schema = UserSchema()


class Note(Model):
    title = CharField()
    content = CharField()
    owner = ForeignKeyField(User)

    class Meta:
        database = db


class NoteSchema(Schema):
    id = fields.Int()
    title = fields.Str(required=True,
                       validate=validate.Length(min=5))
    content = fields.Str()


note_schema = NoteSchema()
notes_schema = NoteSchema(many=True)


def create_tables_if_needed():
    """
    Create models db tables when they don't exist yet.
    """
    db.connect()

    all_models = [Note, User]
    all_models_tables_exist = True

    for model in all_models:
        if not model.table_exists():
            all_models_tables_exist = False
            break

    if not all_models_tables_exist:
        db.create_tables(all_models)
