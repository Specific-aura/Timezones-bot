const { Client, GatewayIntentBits, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, REST, Routes } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

if (!process.env.DISCORD_TOKEN) {
    console.error('DISCORD_TOKEN is not set in your .env file');
    process.exit(1);
}

if (!process.env.CLIENT_ID) {
    console.error('CLIENT_ID is not set in your .env file');
    process.exit(1);
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const db = new sqlite3.Database('./data.db');
const MOD_ROLE_ID = '1162804603872616590';

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        user_id TEXT PRIMARY KEY,
        timezone TEXT,
        languages TEXT,
        is_mod BOOLEAN DEFAULT FALSE
    )`);
});

const timezoneOptions = [
    { label: 'UTC-12', value: 'UTC-12:00' },
    { label: 'UTC-11', value: 'UTC-11:00' },
    { label: 'UTC-10', value: 'UTC-10:00' },
    { label: 'UTC-9', value: 'UTC-09:00' },
    { label: 'UTC-8 (PST)', value: 'UTC-08:00' },
    { label: 'UTC-7 (MST)', value: 'UTC-07:00' },
    { label: 'UTC-6 (CST)', value: 'UTC-06:00' },
    { label: 'UTC-5 (EST)', value: 'UTC-05:00' },
    { label: 'UTC-4 (AST)', value: 'UTC-04:00' },
    { label: 'UTC-3', value: 'UTC-03:00' },
    { label: 'UTC-2', value: 'UTC-02:00' },
    { label: 'UTC-1', value: 'UTC-01:00' },
    { label: 'UTC+0 (GMT)', value: 'UTC+00:00' },
    { label: 'UTC+1 (CET)', value: 'UTC+01:00' },
    { label: 'UTC+2 (EET)', value: 'UTC+02:00' },
    { label: 'UTC+3 (MSK)', value: 'UTC+03:00' },
    { label: 'UTC+4', value: 'UTC+04:00' },
    { label: 'UTC+5', value: 'UTC+05:00' },
    { label: 'UTC+5:30 (IST)', value: 'UTC+05:30' },
    { label: 'UTC+6', value: 'UTC+06:00' },
    { label: 'UTC+7', value: 'UTC+07:00' },
    { label: 'UTC+8 (CST)', value: 'UTC+08:00' },
    { label: 'UTC+9 (JST)', value: 'UTC+09:00' },
    { label: 'UTC+10', value: 'UTC+10:00' },
    { label: 'UTC+11', value: 'UTC+11:00' }
];

const languageOptions = [
    { label: 'English', value: 'English' },
    { label: 'Spanish', value: 'Spanish' },
    { label: 'French', value: 'French' },
    { label: 'German', value: 'German' },
    { label: 'Italian', value: 'Italian' },
    { label: 'Portuguese', value: 'Portuguese' },
    { label: 'Russian', value: 'Russian' },
    { label: 'Chinese', value: 'Chinese' },
    { label: 'Japanese', value: 'Japanese' },
    { label: 'Korean', value: 'Korean' },
    { label: 'Arabic', value: 'Arabic' },
    { label: 'Hindi', value: 'Hindi' },
    { label: 'Dutch', value: 'Dutch' },
    { label: 'Turkish', value: 'Turkish' },
    { label: 'Polish', value: 'Polish' },
    { label: 'Ukrainian', value: 'Ukrainian' },
    { label: 'Greek', value: 'Greek' },
    { label: 'Hebrew', value: 'Hebrew' },
    { label: 'Swedish', value: 'Swedish' },
    { label: 'Norwegian', value: 'Norwegian' },
    { label: 'Danish', value: 'Danish' },
    { label: 'Finnish', value: 'Finnish' },
    { label: 'Czech', value: 'Czech' },
    { label: 'Romanian', value: 'Romanian' },
    { label: 'Hungarian', value: 'Hungarian' }
];

const commands = [
    {
        name: 'set-timezone',
        description: 'Set or edit your timezone using a dropdown menu'
    },
    {
        name: 'set-language',
        description: 'Set or edit the languages you speak'
    },
    {
        name: 'profile',
        description: 'View your own timezone and language information'
    },
    {
        name: 'list-mods-by-timezone',
        description: 'List moderators filtered by timezone',
        options: [
            {
                name: 'timezone',
                type: 3,
                description: 'Filter moderators by timezone',
                required: false,
                choices: timezoneOptions.map(tz => ({ 
                    name: tz.label, 
                    value: tz.value 
                }))
            }
        ]
    },
    {
        name: 'list-users-by-language',
        description: 'List users filtered by language',
        options: [
            {
                name: 'language',
                type: 3,
                description: 'Filter users by language',
                required: false,
                choices: languageOptions.map(lang => ({ 
                    name: lang.label, 
                    value: lang.value 
                }))
            }
        ]
    },
    {
        name: 'set-mod',
        description: 'Set a user as moderator with timezone and languages',
        options: [
            {
                name: 'user',
                type: 6,
                description: 'The user to set as moderator',
                required: true
            },
            {
                name: 'timezone',
                type: 3,
                description: 'The moderators timezone',
                required: false,
                choices: timezoneOptions.map(tz => ({ 
                    name: tz.label, 
                    value: tz.value 
                }))
            },
            {
                name: 'languages',
                type: 3,
                description: 'The moderators languages',
                required: false
            }
        ]
    },
    {
        name: 'remove-mod',
        description: 'Remove moderator status from a user',
        options: [
            {
                name: 'user',
                type: 6,
                description: 'The user to remove as moderator',
                required: true
            }
        ]
    }
];

async function registerCommands() {
    try {
        console.log('Registering slash commands...');

        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );

        console.log('Registered ' + data.length + ' commands');
    } catch (error) {
        console.error('Error registering commands:', error);
        throw error;
    }
}

client.once('ready', () => {
    console.log('Logged in as ' + client.user.tag);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand() && !interaction.isStringSelectMenu()) return;

    try {
        if (interaction.isCommand()) {
            await handleSlashCommand(interaction);
        } else if (interaction.isStringSelectMenu()) {
            await handleSelectMenu(interaction);
        }
    } catch (error) {
        console.error('Error handling interaction:', error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ 
                content: 'Error executing command', 
                flags: 64 
            });
        } else {
            await interaction.reply({ 
                content: 'Error executing command', 
                flags: 64 
            });
        }
    }
});

async function handleSlashCommand(interaction) {
    const { commandName, options } = interaction;

    switch (commandName) {
        case 'set-timezone':
            await showTimezoneSelect(interaction);
            break;
        case 'set-language':
            await showLanguageSelect(interaction);
            break;
        case 'profile':
            await showProfile(interaction);
            break;
        case 'list-mods-by-timezone':
            await listModsByTimezone(interaction, options);
            break;
        case 'list-users-by-language':
            await listUsersByLanguage(interaction, options);
            break;
        case 'set-mod':
            await setModerator(interaction, options);
            break;
        case 'remove-mod':
            await removeModerator(interaction, options);
            break;
    }
}

async function showTimezoneSelect(interaction) {
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('timezone_select')
        .setPlaceholder('Choose your timezone...')
        .addOptions(timezoneOptions);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const embed = new EmbedBuilder()
        .setTitle('Set Your Timezone')
        .setDescription('Select your timezone from the dropdown below:')
        .setColor(0x0099FF);

    await interaction.reply({
        embeds: [embed],
        components: [row],
        flags: 64
    });
}

async function showLanguageSelect(interaction) {
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('language_select')
        .setPlaceholder('Select your languages...')
        .setMinValues(1)
        .setMaxValues(5)
        .addOptions(languageOptions);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const embed = new EmbedBuilder()
        .setTitle('Set Your Languages')
        .setDescription('Select the languages you speak (choose up to 5):')
        .setColor(0xFFA500);

    await interaction.reply({
        embeds: [embed],
        components: [row],
        flags: 64
    });
}

async function handleSelectMenu(interaction) {
    const { customId, values, user } = interaction;

    if (customId === 'timezone_select') {
        const timezone = values[0];
        await saveUserData(user.id, { timezone });
        
        const embed = new EmbedBuilder()
            .setTitle('Timezone Updated')
            .setDescription('Your timezone has been set to: ' + timezone)
            .setColor(0x00FF00);

        await interaction.reply({
            embeds: [embed],
            flags: 64
        });
    } else if (customId === 'language_select') {
        const languages = values.join(', ');
        await saveUserData(user.id, { languages });
        
        const embed = new EmbedBuilder()
            .setTitle('Languages Updated')
            .setDescription('Your languages have been set to: ' + languages)
            .setColor(0x00FF00);

        await interaction.reply({
            embeds: [embed],
            flags: 64
        });
    }
}

function saveUserData(userId, data) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE user_id = ?', [userId], (err, row) => {
            if (err) {
                reject(err);
                return;
            }

            if (row) {
                const updates = [];
                const values = [];
                
                if (data.timezone) {
                    updates.push('timezone = ?');
                    values.push(data.timezone);
                }
                if (data.languages) {
                    updates.push('languages = ?');
                    values.push(data.languages);
                }
                if (data.is_mod !== undefined) {
                    updates.push('is_mod = ?');
                    values.push(data.is_mod);
                }
                
                values.push(userId);
                db.run('UPDATE users SET ' + updates.join(', ') + ' WHERE user_id = ?', values, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            } else {
                db.run(
                    'INSERT INTO users (user_id, timezone, languages, is_mod) VALUES (?, ?, ?, ?)',
                    [userId, data.timezone || null, data.languages || null, data.is_mod || false],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            }
        });
    });
}

async function showProfile(interaction) {
    db.get('SELECT * FROM users WHERE user_id = ?', [interaction.user.id], async (err, row) => {
        if (err) {
            const embed = new EmbedBuilder()
                .setTitle('Error')
                .setDescription('Error fetching your profile.')
                .setColor(0xFF0000);
            
            await interaction.reply({ embeds: [embed], flags: 64 });
            return;
        }

        if (!row) {
            const embed = new EmbedBuilder()
                .setTitle('Profile Setup Required')
                .setDescription('Use /set-timezone and /set-language to set your profile.')
                .setColor(0xFFA500);
            
            await interaction.reply({ embeds: [embed], flags: 64 });
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle('Your Profile')
            .setColor(0x6A5ACD)
            .setThumbnail(interaction.user.displayAvatarURL())
            .addFields(
                { name: 'User', value: interaction.user.tag, inline: true },
                { name: 'Role', value: row.is_mod ? 'Moderator' : 'Member', inline: true },
                { name: 'Timezone', value: row.timezone || 'Not set', inline: true }
            );

        if (row.languages) {
            embed.addFields({
                name: 'Languages',
                value: row.languages.split(', ').map(lang => '* ' + lang).join('\n'),
                inline: false
            });
        } else {
            embed.addFields({
                name: 'Languages',
                value: 'Not set',
                inline: false
            });
        }

        await interaction.reply({ embeds: [embed], flags: 64 });
    });
}

async function listModsByTimezone(interaction, options) {
    if (!interaction.member.roles.cache.has(MOD_ROLE_ID)) {
        const embed = new EmbedBuilder()
            .setTitle('Permission Denied')
            .setDescription('You need the moderator role to use this command.')
            .setColor(0xFF0000);
        
        await interaction.reply({ embeds: [embed], flags: 64 });
        return;
    }

    const timezoneFilter = options.getString('timezone');
    let query = 'SELECT * FROM users WHERE is_mod = TRUE';
    const params = [];

    if (timezoneFilter) {
        query += ' AND timezone = ?';
        params.push(timezoneFilter);
    }

    query += ' ORDER BY timezone';

    db.all(query, params, async (err, rows) => {
        if (err) {
            const embed = new EmbedBuilder()
                .setTitle('Database Error')
                .setDescription('Error fetching moderators.')
                .setColor(0xFF0000);
            
            await interaction.reply({ embeds: [embed], flags: 64 });
            return;
        }

        if (rows.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle('No Moderators Found')
                .setDescription(timezoneFilter ? 
                    'No moderators found in timezone: ' + timezoneFilter : 
                    'No moderators have been set up yet.')
                .setColor(0xFFA500);
            
            await interaction.reply({ embeds: [embed], flags: 64 });
            return;
        }

        const modsByTimezone = {};
        rows.forEach(row => {
            const timezone = row.timezone || 'Not Set';
            if (!modsByTimezone[timezone]) {
                modsByTimezone[timezone] = [];
            }
            modsByTimezone[timezone].push(row);
        });

        const sortedTimezones = Object.keys(modsByTimezone).sort((a, b) => {
            if (a === 'Not Set') return 1;
            if (b === 'Not Set') return -1;
            
            const offsetA = parseFloat(a.replace('UTC', '').replace(':', '.'));
            const offsetB = parseFloat(b.replace('UTC', '').replace(':', '.'));
            
            return offsetA - offsetB;
        });

        const embed = new EmbedBuilder()
            .setTitle('Moderators by Timezone')
            .setColor(0x0099FF)
            .setDescription(timezoneFilter ? 
                'Showing moderators in timezone: ' + timezoneFilter : 
                'Found ' + rows.length + ' moderator(s) across ' + sortedTimezones.length + ' timezone(s)');

        for (const timezone of sortedTimezones) {
            const mods = modsByTimezone[timezone];
            let fieldValue = '';
            
            mods.forEach(mod => {
                const user = client.users.cache.get(mod.user_id);
                const username = user ? user.tag : 'Unknown User';
                fieldValue += '* ' + username + '\n';
            });
            
            embed.addFields({
                name: timezone,
                value: fieldValue || 'No moderators',
                inline: false
            });
        }

        await interaction.reply({ embeds: [embed] });
    });
}

async function listUsersByLanguage(interaction, options) {
    if (!interaction.member.roles.cache.has(MOD_ROLE_ID)) {
        const embed = new EmbedBuilder()
            .setTitle('Permission Denied')
            .setDescription('You need the moderator role to use this command.')
            .setColor(0xFF0000);
        
        await interaction.reply({ embeds: [embed], flags: 64 });
        return;
    }

    const languageFilter = options.getString('language');
    
    if (!languageFilter) {
        const embed = new EmbedBuilder()
            .setTitle('Missing Filter')
            .setDescription('Please specify a language to filter by.')
            .setColor(0xFF0000);
        
        await interaction.reply({ embeds: [embed], flags: 64 });
        return;
    }

    const query = 'SELECT * FROM users WHERE languages LIKE ? ORDER BY is_mod DESC, timezone';
    const params = ['%' + languageFilter + '%'];

    db.all(query, params, async (err, rows) => {
        if (err) {
            const embed = new EmbedBuilder()
                .setTitle('Database Error')
                .setDescription('Error fetching users.')
                .setColor(0xFF0000);
            
            await interaction.reply({ embeds: [embed], flags: 64 });
            return;
        }

        if (rows.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle('No Users Found')
                .setDescription('No users found who speak: ' + languageFilter)
                .setColor(0xFFA500);
            
            await interaction.reply({ embeds: [embed], flags: 64 });
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle('Users by Language')
            .setColor(0x00FF00)
            .setDescription('Found ' + rows.length + ' user(s) who speak: ' + languageFilter);

        const moderators = rows.filter(row => row.is_mod);
        const regularUsers = rows.filter(row => !row.is_mod);

        if (moderators.length > 0) {
            let modsValue = '';
            moderators.forEach(mod => {
                const user = client.users.cache.get(mod.user_id);
                const username = user ? user.tag : 'Unknown User';
                const timezone = mod.timezone || 'Not set';
                modsValue += '* ' + username + ' - ' + timezone + '\n';
            });
            
            embed.addFields({
                name: 'Moderators (' + moderators.length + ')',
                value: modsValue,
                inline: false
            });
        }

        if (regularUsers.length > 0) {
            let usersValue = '';
            regularUsers.forEach(userRow => {
                const user = client.users.cache.get(userRow.user_id);
                const username = user ? user.tag : 'Unknown User';
                const timezone = userRow.timezone || 'Not set';
                usersValue += '* ' + username + ' - ' + timezone + '\n';
            });
            
            embed.addFields({
                name: 'Members (' + regularUsers.length + ')',
                value: usersValue,
                inline: false
            });
        }

        await interaction.reply({ embeds: [embed] });
    });
}

async function setModerator(interaction, options) {
    if (!interaction.member.roles.cache.has(MOD_ROLE_ID)) {
        const embed = new EmbedBuilder()
            .setTitle('Permission Denied')
            .setDescription('You need the moderator role to use this command.')
            .setColor(0xFF0000);
        
        await interaction.reply({ embeds: [embed], flags: 64 });
        return;
    }

    const user = options.getUser('user');
    const timezone = options.getString('timezone');
    const languages = options.getString('languages');

    await saveUserData(user.id, {
        timezone: timezone || null,
        languages: languages || null,
        is_mod: true
    });

    const embed = new EmbedBuilder()
        .setTitle('Moderator Added')
        .setColor(0x00FF00)
        .setDescription(user.tag + ' has been set as a moderator')
        .addFields(
            { name: 'User', value: user.tag, inline: true },
            { name: 'Timezone', value: timezone || 'Not set', inline: true },
            { name: 'Languages', value: languages || 'Not set', inline: true }
        );

    await interaction.reply({ embeds: [embed], flags: 64 });
}

async function removeModerator(interaction, options) {
    if (!interaction.member.roles.cache.has(MOD_ROLE_ID)) {
        const embed = new EmbedBuilder()
            .setTitle('Permission Denied')
            .setDescription('You need the moderator role to use this command.')
            .setColor(0xFF0000);
        
        await interaction.reply({ embeds: [embed], flags: 64 });
        return;
    }

    const user = options.getUser('user');

    db.get('SELECT * FROM users WHERE user_id = ?', [user.id], async (err, row) => {
        if (err) {
            const embed = new EmbedBuilder()
                .setTitle('Database Error')
                .setDescription('Error checking user data.')
                .setColor(0xFF0000);
            
            await interaction.reply({ embeds: [embed], flags: 64 });
            return;
        }

        if (!row || !row.is_mod) {
            const embed = new EmbedBuilder()
                .setTitle('User Not Found')
                .setDescription(user.tag + ' is not a moderator.')
                .setColor(0xFFA500);
            
            await interaction.reply({ embeds: [embed], flags: 64 });
            return;
        }

        await saveUserData(user.id, { is_mod: false });

        const embed = new EmbedBuilder()
            .setTitle('Moderator Removed')
            .setColor(0x00FF00)
            .setDescription(user.tag + ' has been removed as a moderator')
            .addFields(
                { name: 'User', value: user.tag, inline: true },
                { name: 'Timezone', value: row.timezone || 'Not set', inline: true },
                { name: 'Languages', value: row.languages || 'Not set', inline: true }
            );

        await interaction.reply({ embeds: [embed], flags: 64 });
    });
}

async function startBot() {
    try {
        console.log('Starting Timezone Bot...');
        
        await registerCommands();
        
        await client.login(process.env.DISCORD_TOKEN);
        
    } catch (error) {
        console.error('Failed to start bot:', error);
        process.exit(1);
    }
}

startBot();