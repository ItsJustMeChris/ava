# Ava

A personal CLI assistant built with Bun and TypeScript. Ava uses a pluggable architecture to provide journaling, AI chat, random value generation, and liturgical calendar features from your terminal.

## Install

```bash
bun install
bun link
```

Once linked, `ava` is available globally.

## Usage

Running `ava` with no arguments shows a dashboard summarizing your recent entries.

```bash
ava            # Dashboard overview
ava help       # List all commands
```

### Journal Plugins

Journal plugins share a common pattern: a singular command to add entries and a plural command to list/manage them.

```bash
ava todo <text>           # Add a todo
ava todos                 # List all todos
ava todos remove <#>      # Remove a todo by index

ava thought <text>        # Record a thought
ava thoughts              # List all thoughts
ava thoughts remove <#>   # Remove a thought by index

ava idea <text>           # Save an idea
ava ideas                 # List all ideas
ava ideas remove <#>      # Remove an idea by index
```

### Ask

Single-shot LLM question with streamed response.

```bash
ava ask <prompt>
```

### Chat

Interactive multi-turn conversations with thread persistence.

```bash
ava chat                  # Start a new conversation
ava chat <#>              # Resume a previous conversation
ava chats                 # List saved threads
ava chats remove <#>      # Delete a thread
```

### Random

Generate random values for passwords, tokens, IDs, and more.

```bash
ava random bytes [len=16]           # Random bytes as hex
ava random words [count=4]          # Passphrase words joined by dashes
ava random string [len=32]          # Alphanumeric string
ava random playful [count=2]        # Adjective-noun combos
ava random uuid                     # UUID v4
ava random int [min=0] [max=100]    # Random integer (inclusive)
ava random hex [len=32]             # Hex string
ava random color [count=1]          # Hex color code with swatch
```

### Orthodoxy

Orthodox liturgical calendar information for today.

```bash
ava orthodoxy             # Daily snapshot
ava orthodoxy fast        # Fasting rule
ava orthodoxy saints      # Saints and feasts
ava orthodoxy readings    # Scripture readings
ava orthodoxy feasts      # Feasts and celebrations
```

## Development

```bash
bun run start             # Run the CLI
bun lint                  # ESLint
bun typecheck             # TypeScript type checking
bun test                  # All tests
bun test:unit             # Unit tests only
bun test:integration      # Integration tests only
```

## Architecture

```
index.ts                  # Entry point, registers plugins
src/
  cli.ts                  # Argument parsing, dashboard, help
  sdk/                    # Plugin system core
    types.ts              # AvaPlugin, AvaCommand, Entry interfaces
    registry.ts           # PluginRegistry (command indexing + dispatch)
    storage.ts            # JSON file persistence (~/.ava/data/)
    journal.ts            # Factory for add/list/remove journal plugins
    format.ts             # ANSI colors, relative time, formatting
    system-prompt.ts      # LLM system prompt builder
  plugins/
    todo.ts               # Journal plugin: todos
    thought.ts            # Journal plugin: thoughts
    idea.ts               # Journal plugin: ideas
    ask.ts                # Single-shot LLM query
    chat/                 # Multi-turn chat with thread persistence
    random/               # Random value generators
    orthodoxy/            # Orthodox liturgical calendar
```

Data is persisted as JSON files in `~/.ava/data/`. Set `AVA_DATA_DIR` to override the storage path.
