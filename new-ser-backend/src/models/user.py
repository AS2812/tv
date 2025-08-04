from datetime import datetime
import uuid

def create_user_model(db):
    class User(db.Model):
        __tablename__ = 'users'
        __table_args__ = {'extend_existing': True}
        
        id = db.Column(db.String(36), primary_key=True)
        username = db.Column(db.String(80), unique=True, nullable=False)
        password_hash = db.Column(db.String(128), nullable=False)
        display_name = db.Column(db.String(100), nullable=True)
        email = db.Column(db.String(120), unique=False, nullable=True)  # Not unique to avoid conflicts
        avatar_url = db.Column(db.String(200), nullable=True)
        gender = db.Column(db.String(10), nullable=True)
        is_admin = db.Column(db.Boolean, default=False)
        is_banned = db.Column(db.Boolean, default=False)
        ban_reason = db.Column(db.Text, nullable=True)
        created_at = db.Column(db.DateTime, default=datetime.utcnow)
        last_active = db.Column(db.DateTime, default=datetime.utcnow)
        profile_completed = db.Column(db.Boolean, default=False)
        
        def __init__(self, **kwargs):
            if 'id' not in kwargs:
                kwargs['id'] = str(uuid.uuid4())
            super(User, self).__init__(**kwargs)
        
        def to_dict(self):
            return {
                'id': self.id,
                'username': self.username,
                'display_name': self.display_name,
                'email': self.email,
                'avatar_url': self.avatar_url,
                'gender': self.gender,
                'profile_completed': self.profile_completed,
                'created_at': self.created_at.isoformat() if self.created_at else None,
                'last_active': self.last_active.isoformat() if self.last_active else None
            }
    return User


