/* Gisma DB */
DROP SCHEMA IF EXISTS gisma CASCADE;
CREATE SCHEMA gisma;
SET search_path TO gisma;

/* Students Service */

CREATE TABLE students (
    id UUID PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    enroll_year INT NOT NULL,
    status VARCHAR(50) NOT NULL
);

CREATE TABLE student_cards (
    code VARCHAR(100) PRIMARY KEY,
    student_id UUID NOT NULL,
    issued_at TIMESTAMP NOT NULL,
    access_level VARCHAR(50) NOT NULL,
    CONSTRAINT fk_student_cards_student FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_student_cards_student_id ON student_cards(student_id);



/* Library Service */

CREATE TABLE library_members (
    ref VARCHAR(100) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    joined_at TIMESTAMP NOT NULL,
    tier VARCHAR(50) NOT NULL
);

CREATE TABLE book_loans (
    id UUID PRIMARY KEY,
    member_ref VARCHAR(100) NOT NULL,
    book_title VARCHAR(255) NOT NULL,
    borrowed_at TIMESTAMP NOT NULL,
    due_at TIMESTAMP NOT NULL,
    returned_at TIMESTAMP,
    CONSTRAINT fk_book_loans_member FOREIGN KEY (member_ref) REFERENCES library_members(ref)
);

CREATE INDEX idx_library_members_email ON library_members(email);
CREATE INDEX idx_book_loans_member_ref ON book_loans(member_ref);
CREATE INDEX idx_book_loans_due_at ON book_loans(due_at);



/* Cafeteria Service */

CREATE TABLE meal_wallets (
    no VARCHAR(100) PRIMARY KEY,
    card_code VARCHAR(100) UNIQUE NOT NULL,
    balance NUMERIC(10,2) NOT NULL,
    last_topup_at TIMESTAMP
);

CREATE TABLE meal_orders (
    id UUID PRIMARY KEY,
    wallet_no VARCHAR(100) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    ordered_at TIMESTAMP NOT NULL,
    total NUMERIC(10,2) NOT NULL,
    CONSTRAINT fk_meal_orders_wallet FOREIGN KEY (wallet_no) REFERENCES meal_wallets(no)
);

CREATE INDEX idx_meal_wallets_card_code ON meal_wallets(card_code);
CREATE INDEX idx_meal_orders_wallet_no ON meal_orders(wallet_no);
CREATE INDEX idx_meal_orders_ordered_at ON meal_orders(ordered_at);


/* insert some data */


/* Students Service */

INSERT INTO students (id, full_name, email, enroll_year, status) VALUES
('11111111-1111-1111-1111-111111111111', 'Adam Sion', 'adam.sion@campus.edu', 2023, 'active'),
('22222222-2222-2222-2222-222222222222', 'Maya Levi', 'maya.levi@campus.edu', 2022, 'active'),
('33333333-3333-3333-3333-333333333333', 'Noam Cohen', 'noam.cohen@campus.edu', 2021, 'active'),
('44444444-4444-4444-4444-444444444444', 'Dana Katz', 'dana.katz@campus.edu', 2020, 'graduated'),
('55555555-5555-5555-5555-555555555555', 'Yuval Bar', 'yuval.bar@campus.edu', 2024, 'active'),
('66666666-6666-6666-6666-666666666666', 'Lior Azulay', 'lior.azulay@campus.edu', 2023, 'suspended');

INSERT INTO student_cards (code, student_id, issued_at, access_level) VALUES
('CARD-1001', '11111111-1111-1111-1111-111111111111', '2023-10-01 09:00:00', 'regular'),
('CARD-1002', '22222222-2222-2222-2222-222222222222', '2022-10-10 09:00:00', 'regular'),
('CARD-1003', '33333333-3333-3333-3333-333333333333', '2021-10-15 09:00:00', 'lab'),
('CARD-1004', '44444444-4444-4444-4444-444444444444', '2020-10-20 09:00:00', 'regular'),
('CARD-1005', '55555555-5555-5555-5555-555555555555', '2024-11-01 09:00:00', 'regular'),
('CARD-1006', '66666666-6666-6666-6666-666666666666', '2023-11-05 09:00:00', 'restricted');



/* Library Service */

INSERT INTO library_members (ref, email, joined_at, tier) VALUES
('LIB-001', 'adam.sion@campus.edu', '2023-10-03 10:00:00', 'standard'),
('LIB-002', 'maya.levi@campus.edu', '2022-10-12 10:00:00', 'premium'),
('LIB-003', 'noam.cohen@campus.edu', '2021-10-20 10:00:00', 'standard'),
('LIB-004', 'dana.katz@campus.edu', '2020-10-25 10:00:00', 'research'),
('LIB-005', 'yuval.bar@campus.edu', '2024-11-03 10:00:00', 'standard');

INSERT INTO book_loans (id, member_ref, book_title, borrowed_at, due_at, returned_at) VALUES
('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'LIB-001', 'Distributed Systems', '2026-03-01 10:00:00', '2026-03-10 10:00:00', NULL),
('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'LIB-001', 'PostgreSQL Basics', '2026-02-20 12:00:00', '2026-03-01 12:00:00', '2026-02-27 09:00:00'),
('bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'LIB-002', 'Spring in Action', '2026-03-05 14:00:00', '2026-03-19 14:00:00', NULL),
('ccccccc1-cccc-cccc-cccc-ccccccccccc1', 'LIB-003', 'Kafka Essentials', '2026-02-25 11:00:00', '2026-03-05 11:00:00', NULL),
('ddddddd1-dddd-dddd-dddd-ddddddddddd1', 'LIB-004', 'Graph Theory', '2026-01-15 09:30:00', '2026-01-25 09:30:00', '2026-01-20 08:00:00'),
('eeeeeee1-eeee-eeee-eeee-eeeeeeeeeee1', 'LIB-005', 'Clean Code', '2026-03-08 16:00:00', '2026-03-22 16:00:00', NULL);



/* Cafeteria Service */

INSERT INTO meal_wallets (no, card_code, balance, last_topup_at) VALUES
('WAL-001', 'CARD-1001', 32.50, '2026-03-15 08:00:00'),
('WAL-002', 'CARD-1002', 12.00, '2026-03-14 18:30:00'),
('WAL-003', 'CARD-1003', 4.50,  '2026-03-10 13:00:00'),
('WAL-004', 'CARD-1004', 50.00, '2026-02-28 09:00:00'),
('WAL-005', 'CARD-1005', 7.00,  '2026-03-16 10:00:00'),
('WAL-006', 'CARD-1006', 0.00,  '2026-03-01 12:00:00');

INSERT INTO meal_orders (id, wallet_no, item_name, ordered_at, total) VALUES
('f1111111-1111-1111-1111-111111111111', 'WAL-001', 'Coffee',      '2026-03-16 08:15:00', 8.50),
('f1111111-1111-1111-1111-111111111112', 'WAL-001', 'Sandwich',    '2026-03-16 12:40:00', 18.00),
('f2222222-2222-2222-2222-222222222221', 'WAL-002', 'Salad',       '2026-03-15 13:10:00', 22.00),
('f2222222-2222-2222-2222-222222222222', 'WAL-002', 'Coffee',      '2026-03-17 09:05:00', 8.50),
('f3333333-3333-3333-3333-333333333331', 'WAL-003', 'Burger',      '2026-03-14 14:20:00', 32.00),
('f3333333-3333-3333-3333-333333333332', 'WAL-003', 'Water',       '2026-03-17 10:00:00', 5.00),
('f4444444-4444-4444-4444-444444444441', 'WAL-004', 'Pasta',       '2026-03-01 12:00:00', 28.00),
('f5555555-5555-5555-5555-555555555551', 'WAL-005', 'Toast',       '2026-03-16 09:20:00', 14.00),
('f5555555-5555-5555-5555-555555555552', 'WAL-005', 'Juice',       '2026-03-16 09:25:00', 9.00),
('f6666666-6666-6666-6666-666666666661', 'WAL-006', 'Coffee',      '2026-03-02 08:10:00', 8.50);