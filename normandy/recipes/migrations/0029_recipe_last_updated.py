# -*- coding: utf-8 -*-
# Generated by Django 1.9 on 2016-06-09 19:23
from __future__ import unicode_literals

from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('recipes', '0028_auto_20160524_1756'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='recipe',
            options={'ordering': ['-enabled', '-last_updated']},
        ),
        migrations.AddField(
            model_name='recipe',
            name='last_updated',
            field=models.DateTimeField(auto_now=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
    ]
