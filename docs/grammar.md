# Definition File Grammar

This file documents the formal grammar defined for the definition files. It should give you some insight into how your definition files are parsed, if the README documentation is insufficient.
If you notice that the behaviour of the parser departs from the documented grammar here, do let me know by raising an issue.

The following is written in extended Backus-Naur form.

## Consolidated definition file grammar

```text
doc = { def-block, [ delimiter, { "\n" }] }, eof;
def-block = header, "\n", [ alias, { char }, "\n" ], def;
header = "#", " ", { char };
alias = { "\n" }, "*", [{ { char }, "," }], { char }, "*";
def = { char };
char = any char;
delimiter = "\n", { " " }, "-", "-", "-", { " " }, "\n";
```

The only terminal is an end-of-file after all def-blocks. If a delimeter is given, then another def-block is expected.
So a valid file should not provide a trailing delimiter at the end of the file.
