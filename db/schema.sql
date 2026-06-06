-- SQL Schema for ZenPath / Bloom Wellness Application
-- Target Database: PostgreSQL

-- Users Table
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    mobile VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active', -- active, banned
    is_premium BOOLEAN DEFAULT FALSE,
    avatar TEXT,
    country VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    role VARCHAR(20) DEFAULT 'user' -- user, admin
);

-- Wellness Daily Entries
CREATE TABLE wellness_entries (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    mood INT CHECK (mood >= 1 AND mood <= 10),
    energy INT CHECK (energy >= 1 AND energy <= 10),
    gratitude TEXT,
    focus TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

-- Friendships Table
CREATE TABLE friendships (
    id VARCHAR(50) PRIMARY KEY,
    user_sender_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    user_receiver_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending', -- pending, accepted
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_sender_id, user_receiver_id)
);

-- Posts/Social Timeline Table
CREATE TABLE posts (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    likes TEXT[], -- array of user IDs
    achievements TEXT[], -- array of unlocked badges
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Comments Table
CREATE TABLE comments (
    id VARCHAR(50) PRIMARY KEY,
    post_id VARCHAR(50) REFERENCES posts(id) ON DELETE CASCADE,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Direct Chat Messages
CREATE TABLE chat_messages (
    id VARCHAR(50) PRIMARY KEY,
    sender_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    receiver_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    content TEXT,
    image_url TEXT,
    emoji VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Developer API Keys Table
CREATE TABLE api_keys (
    id VARCHAR(50) PRIMARY KEY,
    api_key VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    permissions VARCHAR(20) DEFAULT 'read', -- read, write, admin
    rate_limit INT DEFAULT 60, -- requests per minute
    status VARCHAR(20) DEFAULT 'active', -- active, revoked
    usage_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System Configuration Table
CREATE TABLE system_config (
    id SERIAL PRIMARY KEY,
    maintenance_mode BOOLEAN DEFAULT FALSE,
    gemini_api_key VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System Logs Table
CREATE TABLE system_logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    action VARCHAR(100) NOT NULL,
    admin VARCHAR(100),
    details TEXT,
    type VARCHAR(20) DEFAULT 'info' -- info, warning, error, security
);
