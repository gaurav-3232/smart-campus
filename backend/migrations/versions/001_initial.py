"""Initial schema with exclusion constraint

Revision ID: 001_initial
Revises:
Create Date: 2026-03-11
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable btree_gist extension (required for exclusion constraints with non-GiST types)
    op.execute("CREATE EXTENSION IF NOT EXISTS btree_gist")

    # Users table
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("email", sa.String(255), unique=True, nullable=False, index=True),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("role", sa.Enum("admin", "staff", "student", name="userrole"), nullable=False, server_default="student"),
        sa.Column("department", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # Resources table
    op.create_table(
        "resources",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("resource_type", sa.Enum("room", "lab", "equipment", name="resourcetype"), nullable=False),
        sa.Column("description", sa.String(1000), nullable=True),
        sa.Column("location", sa.String(255), nullable=True),
        sa.Column("capacity", sa.Integer(), nullable=True),
        sa.Column("amenities", postgresql.JSON(), server_default="[]"),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_resources_type", "resources", ["resource_type"])

    # Bookings table
    op.create_table(
        "bookings",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("resource_id", sa.Integer(), sa.ForeignKey("resources.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.String(1000), nullable=True),
        sa.Column("start_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.Enum("confirmed", "cancelled", "completed", name="bookingstatus"), nullable=False, server_default="confirmed"),
        sa.Column("recurring_group_id", sa.String(36), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    op.create_index("ix_bookings_resource_id", "bookings", ["resource_id"])
    op.create_index("ix_bookings_user_id", "bookings", ["user_id"])
    op.create_index("ix_bookings_resource_time", "bookings", ["resource_id", "start_time", "end_time"])
    op.create_index("ix_bookings_recurring", "bookings", ["recurring_group_id"])

    # Check constraint: end_time must be after start_time
    op.create_check_constraint("ck_booking_time_order", "bookings", "end_time > start_time")

    # EXCLUSION CONSTRAINT: Prevent overlapping bookings for the same resource
    # This is the PostgreSQL-level guarantee against double-booking under concurrent access
    op.execute("""
        ALTER TABLE bookings ADD CONSTRAINT excl_no_overlap
        EXCLUDE USING gist (
            resource_id WITH =,
            tstzrange(start_time, end_time) WITH &&
        )
        WHERE (status = 'confirmed')
    """)

    # Seed some default resources
    op.execute("""
        INSERT INTO resources (name, resource_type, description, location, capacity, amenities) VALUES
        ('Lecture Hall A', 'room', 'Large lecture hall with tiered seating', 'Building 1, Floor 1', 200, '["projector", "microphone", "whiteboard", "wifi"]'),
        ('Lecture Hall B', 'room', 'Medium lecture hall', 'Building 1, Floor 2', 100, '["projector", "whiteboard", "wifi"]'),
        ('Seminar Room 101', 'room', 'Small seminar room', 'Building 2, Floor 1', 30, '["whiteboard", "wifi", "tv_screen"]'),
        ('Seminar Room 102', 'room', 'Small seminar room with video conferencing', 'Building 2, Floor 1', 25, '["whiteboard", "wifi", "video_conference"]'),
        ('Computer Lab 1', 'lab', 'General-purpose computer lab with 40 workstations', 'Building 3, Floor 1', 40, '["computers", "printer", "wifi"]'),
        ('Computer Lab 2', 'lab', 'Specialized lab for data science courses', 'Building 3, Floor 2', 30, '["computers", "gpu_workstations", "wifi"]'),
        ('Physics Lab', 'lab', 'Undergraduate physics experiments lab', 'Science Building, Floor 1', 25, '["lab_equipment", "safety_stations"]'),
        ('Chemistry Lab', 'lab', 'General chemistry lab with fume hoods', 'Science Building, Floor 2', 20, '["fume_hoods", "lab_equipment", "safety_stations"]'),
        ('3D Printer Station', 'equipment', 'Prusa MK4 3D printers (2 units)', 'Maker Space', 2, '["3d_printer"]'),
        ('Projector Kit A', 'equipment', 'Portable projector with screen', 'Equipment Room 1', 1, '["portable_projector", "screen"]'),
        ('Study Room 1', 'room', 'Quiet group study room', 'Library, Floor 2', 8, '["whiteboard", "wifi", "power_outlets"]'),
        ('Study Room 2', 'room', 'Quiet group study room', 'Library, Floor 2', 6, '["whiteboard", "wifi", "power_outlets"]')
    """)

    # Seed admin user (password: admin123!)
    op.execute("""
        INSERT INTO users (email, full_name, hashed_password, role, department) VALUES
        ('admin@campus.edu', 'Campus Admin', '$2b$12$LJ3m4ys3Lz0QV5X5A5Q5O.8XlZwZKEh.q1C5H5X5A5Q5O.8XlZwZ', 'admin', 'Administration')
    """)


def downgrade() -> None:
    op.drop_table("bookings")
    op.drop_table("resources")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS bookingstatus")
    op.execute("DROP TYPE IF EXISTS resourcetype")
    op.execute("DROP TYPE IF EXISTS userrole")
