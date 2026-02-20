import time


class SimpleCache:
    def __init__(self):
        self.store = {}
        self.ttl = 60  # seconds

    def get(self, key):
        item = self.store.get(key)
        if not item:
            return None

        value, timestamp = item

        if time.time() - timestamp > self.ttl:
            del self.store[key]
            return None

        return value

    def set(self, key, value):
        self.store[key] = (value, time.time())


cache = SimpleCache()
