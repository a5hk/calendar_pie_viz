# Threshold

This visualization app lets you choose different colors for different ranges of values by adjusting the thresholds.

## Examples

```
| tstats prestats=t count where index=_audit by _time span=1m
| timechart span=1m count
```

![demo](/static/demo.gif)

## License

[MIT License](LICENSE)
